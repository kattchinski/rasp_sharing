// Import core Node.js and external libraries
const express = require('express');        // Web framework to handle HTTP requests
const http = require('http');              // Built-in Node module to create the server
const { Server } = require('socket.io');   // WebSocket library for real-time, two-way communication
const cors = require('cors');              // Middleware to allow the browser to talk to a different port (5173 -> 3001)
const { exec } = require('child_process'); // Allows Node to run shell commands (like nmcli) in the background

// Initialize Express app and enable CORS
const app = express(); // Craetedan empty server 
app.use(cors()); // Allow requests from the React frontend (running on a different port)

// Create a standard HTTP server using the Express app
const server = http.createServer(app);

// Initialize Socket.io on top of the HTTP server
const io = new Server(server, {
  // Security: Only allow connections from your React development server
  cors: { origin: "http://localhost:5173" } 
});

/**
 * LOGIC: Function to interact with the OS
 * Uses a Promise because executing shell commands is an "asynchronous" task.
 * 
 */
const scanWifi = () => {
    // Якщо вийде виконати команду, ми повернемо список, якщо ні - повернемо reject.
  return new Promise((resolve, reject) => {
    /**
     * EXECUTING SHELL COMMAND:
     * 'nmcli' - Network Manager Command Line Interface
     * '-t' - Terse mode (removes fancy formatting, uses ':' as a separator)
     * '-f SSID,BARS,SECURITY' - Only return these specific columns
     * 'dev wifi list' - The actual instruction to list nearby Access Points
     */
    exec('nmcli -t -f SSID,BARS,SECURITY dev wifi list', (error, stdout, stderr) => {
      // If the command itself fails (e.g., WiFi adapter is off)
      if (error) return reject(stderr);
      
      /**
       * DATA PARSING:
       * stdout is the "string" result from the terminal. 
       * We split it by new lines (\n), remove empty lines, 
       * and then split each line by ':' to turn it into a clean JavaScript Object.
       */
      const networks = stdout.split('\n')
        .filter(line => line.trim() !== '') // Remove trailing empty lines
        .map(line => {
          const [ssid, signal, security] = line.split(':');
          return { 
            ssid: ssid || "Hidden Network", // Handle hidden SSIDs
            signal, 
            security 
          };
        });
      
        resolve(networks); // Return the final array of objects to the caller
        });
    });
    };



    // function to connect to Wi-Fi
    const connectToWiFi = (ssid, password) => {
        return new Promise((resolve, reject) => {
        // Construct the nmcli command to connect to the specified Wi-Fi network
        const command = `nmcli dev wifi connect "${ssid}" password "${password}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
            console.error("Connection error:", stderr);
            return reject(stderr);
            }
            resolve(stdout); // Return success message from nmcli
        });
        });
    };
  
    // Function to get the currently active Wi-Fi SSID
    const getActiveWifi = () => {
    return new Promise((resolve) => {
        // '-t' for terse, '-f' for fields, 'con show --active' filters for active connections
        exec("nmcli -t -f active,ssid dev wifi list | grep '^yes' | cut -d':' -f2", (error, stdout) => {
        if (error || !stdout) return resolve(null);
        resolve(stdout.trim());
        });
    });
};

/**
 * WEBSOCKET EVENT HANDLING:
 * This runs every time a user opens your React app in the browser.
 */
io.on('connection', async (socket) => {
  console.log('Client connected to dashboard');


  // Send current status immediately on login
  const active = await getActiveWifi();
  socket.emit('active-wifi', active);
  /**
   * LISTEN for 'request-scan' from React (Frontend)
   * When you click the "Scan" button in React, it sends this message.
   */
  socket.on('request-scan', async () => {
    try {
      // Run the system command function defined above
      const data = await scanWifi();
      
      // SEND the data back ONLY to the specific user who asked for it
      socket.emit('wifi-list', data);
    } catch (err) {
      console.error("Scan error:", err);
      // Let the user know something went wrong on the server side
      socket.emit('error', 'Failed to scan Wi-Fi. Check if your Wi-Fi is on.');
    }
    });

    // Log when a user closes the browser tab
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });


    // Обробник запиту на підключення
    socket.on('request-connect', async ({ ssid, password }) => {
    try {
      console.log(`Спроба підключення до: ${ssid}`);
      const result = await connectToWiFi(ssid, password);
      
      // Повідомляємо фронтенду про успіх
      socket.emit('connect-success', { ssid, message: result });
    } catch (err) {
      console.error("Помилка підключення:", err);
      socket.emit('error', `Не вдалося підключитися до ${ssid}. Перевір пароль.`);
    }
  });
});


/**
 * START THE SERVER:
 * Your backend will live on Port 3001.
 */
server.listen(3001, () => {
  console.log('Backend is live at http://localhost:3001');
});