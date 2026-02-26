<img width="1846" height="902" alt="image" src="https://github.com/user-attachments/assets/a9922c58-b620-479b-9bf4-d348b4f0dd3c" />

# rasp_sharing
Allow to create ethernet bridge between two raspberries 

sudo apt update
sudo apt install dnsmasq-base -y

sudo nmcli connection add type ethernet ifname eth0 con-name "Rasp_Sharing" ipv4.method shared
sudo nmcli connection up "Rasp_Sharing"

chmod +x keep_shared.sh
sudo ./keep_shared.sh

sudo systemctl daemon-reload
sudo systemctl enable rasp-share.service
sudo systemctl start rasp-share.service
