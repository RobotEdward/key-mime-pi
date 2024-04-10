#!/bin/bash


# Define the service name and python script name
service_name="key-mime-pi"
python_script_name="/app/main.py"

# Get the current working directory
working_directory=$(pwd)

# Path to the virtual environment's Python interpreter
python_interpreter="$working_directory/venv/bin/python"
venv_path="$working_directory/venv"

# Check if the virtual environment exists
if [ ! -d "$venv_path" ]; then
    echo "The virtual environment does not exist in $working_directory."
    echo "Please create a virtual environment named 'venv' in the current directory before running this script."
    echo "You'll also need to enable USB gadget support on this Pi if you haven't already done so."
    echo "See README for instructions."
    exit 1
fi


# Get the current username as the default
current_user=$(whoami)

# Ask for the username, suggest the current user as the default
read -p "Enter the username under which the service should run [$current_user]: " username
username=${username:-$current_user}

# Service file path
service_file="/etc/systemd/system/$service_name.service"

# Creating the service file
echo "Creating the service file at $service_file..."
sudo bash -c "cat > $service_file" <<EOF
[Unit]
Description=Key Mime Pi
After=network.target

[Service]
User=$username
WorkingDirectory=$working_directory
ExecStart=$python_interpreter $working_directory/$python_script_name
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reloading systemd to recognize the new service
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Enabling the service to start on boot
echo "Enabling the service to start on boot..."
sudo systemctl enable $service_name

# Starting the service
echo "Starting the service..."
sudo systemctl start $service_name

echo "$service_name is now set up and started."
