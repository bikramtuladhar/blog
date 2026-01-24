---
layout: BookLayout
title: "Automating Proxmox and MAAS Integration for Your Home Lab"
date: 2024-08-26T01:27:39.651Z
---

# Automating Proxmox and MAAS Integration for Your Home Lab

![Proxmox MAAS](/images/posts/proxmox-maas-cover.jpeg)

For those managing a home lab, integrating Proxmox VE with MAAS (Metal as a Service) can streamline the management of both physical and virtual resources. Automating this integration process can save time and reduce manual intervention. This guide covers how to set up a seamless automation process using Python, Bash scripts, and systemd.

## Overview

The automation script setup includes:

1. A Python Flask application that communicates with Proxmox and MAAS APIs.
2. A systemd service to run the Flask app as a background service.
3. A Bash script that triggers the integration process during MAAS commissioning.

## 1. Python Script: `maas-proxmox-integration.py`

This Flask application updates MAAS with information about Proxmox VMs based on their MAC addresses. Here's the complete code:

```python
#!/usr/bin/env python3

from flask import Flask, request, jsonify
import requests
import warnings
from urllib3.exceptions import InsecureRequestWarning
from oauthlib.oauth1 import SIGNATURE_PLAINTEXT
from requests_oauthlib import OAuth1Session
import time
import threading

# Suppress InsecureRequestWarning
warnings.filterwarnings('ignore', category=InsecureRequestWarning)

# Proxmox API credentials
PROXMOX_HOST = "<proxmox_ip>"
USER = "user@realm"
TOKENID = "token_id"
SECRET = "secret"

# MAAS API credentials
MAAS_API_KEY = "maas api key"
MAAS_API_URL = "http://<maas_ip>:5240/MAAS/api/2.0"
CONSUMER_KEY, CONSUMER_TOKEN, MAAS_SECRET = MAAS_API_KEY.split(":")

# Create OAuth1Session for MAAS
maas = OAuth1Session(
    CONSUMER_KEY,
    resource_owner_key=CONSUMER_TOKEN,
    resource_owner_secret=MAAS_SECRET,
    signature_method=SIGNATURE_PLAINTEXT
)

# Proxmox API headers
proxmox_headers = {
    'Authorization': f'PVEAPIToken={USER}!{TOKENID}={SECRET}'
}

app = Flask(__name__)

def get_proxmox_nodes():
    try:
        response = requests.get(f'https://{PROXMOX_HOST}:8006/api2/json/nodes', headers=proxmox_headers, verify=False)
        response.raise_for_status()
        return response.json().get('data', [])
    except requests.exceptions.RequestException as e:
        print(f'Error fetching Proxmox nodes: {e}')
        return []

def get_proxmox_vms(node):
    try:
        response = requests.get(f'https://{PROXMOX_HOST}:8006/api2/json/nodes/{node}/qemu', headers=proxmox_headers, verify=False)
        response.raise_for_status()
        return response.json().get('data', [])
    except requests.exceptions.RequestException as e:
        print(f'Error fetching VMs for node {node}: {e}')
        return []

def get_proxmox_vm_config(node, vm_id):
    try:
        response = requests.get(f'https://{PROXMOX_HOST}:8006/api2/json/nodes/{node}/qemu/{vm_id}/config', headers=proxmox_headers, verify=False)
        response.raise_for_status()
        return response.json().get('data', {})
    except requests.exceptions.RequestException as e:
        print(f'Error fetching VM config for VM {vm_id}: {e}')
        return {}

def find_vm_by_mac(mac_address):
    nodes = get_proxmox_nodes()
    for node in nodes:
        node_id = node['node']
        vms = get_proxmox_vms(node_id)
        for vm in vms:
            vm_id = vm['vmid']
            vm_name = vm['name']
            config = get_proxmox_vm_config(node_id, vm_id)
            for key, value in config.items():
                if key.startswith('net'):
                    if mac_address.upper() in value:
                        return node_id, vm_id, vm_name
    return None, None, None

def get_maas_machine_by_mac(mac_address):
    try:
        response = maas.get(f"{MAAS_API_URL}/machines/", params={'mac_address': mac_address,'status': 'new'})
        response.raise_for_status()
        machines = response.json()
        if machines:
            return machines[0]
        return None
    except requests.exceptions.RequestException as e:
        print(f'Error fetching MAAS machine with MAC address {mac_address}: {e}')
        return None

def update_maas_machine(machine_id, hostname, node_id, vm_id, username, password):
    try:
        data = {
            "hostname": hostname,
            "power_type": "proxmox",
            "power_parameters_power_address": PROXMOX_HOST,
            "power_parameters_power_vm_name": vm_id,
            "power_parameters_power_user": username,
            "power_parameters_power_pass": password,
            "power_parameters_power_verify_ssl": "n"
        }
        response = maas.put(f"{MAAS_API_URL}/machines/{machine_id}/", data=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error updating MAAS machine {machine_id}: {e}")
        return None

def commission_maas_machine(machine_id):
    try:
        response = maas.post(f"{MAAS_API_URL}/machines/{machine_id}/op-commission")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error commissioning MAAS machine {machine_id}: {e}")
        return None

def update_maas_with_proxmox_info_background(mac_address):
    mac_address = mac_address.lower()
    if not mac_address:
        return jsonify({"error": "MAC address is required"}), 400

    node_id, vm_id, vm_name = find_vm_by_mac(mac_address)
    if not vm_id:
        print(f'Error: No VM found with MAC address {mac_address}')
        return

    start_time = time.time()
    retry_interval = 5

    while True:
        maas_machine = get_maas_machine_by_mac(mac_address)
        if maas_machine:
            break
        if time.time() - start_time > 60:
            print(f'Error: No MAAS machine found with MAC address {mac_address} after 1 minute')
            return
        time.sleep(retry_interval)

    machine_id = maas_machine['system_id']
    # wait for initial machine enlisting to finish
    time.sleep(60)
    update_result = update_maas_machine(
        machine_id=machine_id,
        hostname=vm_name,
        node_id=node_id,
        vm_id=vm_id,
        username="user@relam",
        password="proxmox password",
    )

    if update_result:
        commission_result = commission_maas_machine(machine_id)
        if commission_result:
            print(f'MAAS machine {machine_id} updated and deployed successfully.')
        else:
            print(f'Failed to deploy MAAS machine {machine_id}')
    else:
        print(f'Failed to update MAAS machine {machine_id}')

@app.route('/update_maas', methods=['GET'])
def update_maas_with_proxmox_info():
    mac_address = request.args.get('mac_address')
    if not mac_address:
        return jsonify({"error": "MAC address is required"}), 400

    thread = threading.Thread(target=update_maas_with_proxmox_info_background, args=(mac_address,))
    thread.start()

    return jsonify({"message": "Update process started in the background."})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
```

## 2. Systemd Service: `maas-proxmox-integration.service`

To run the Python script as a service, create a systemd service file:

```ini
[Unit]
Description=MAAS Proxmox Integration Service

[Service]
ExecStart=/usr/bin/python3 path/to/maas-proxmox-integration.py
WorkingDirectory=path/to
Restart=always
User=example-username
Group=example-group
StandardOutput=append:/var/log/maas-proxmox-integration.log
StandardError=append:/var/log/maas-proxmox-integration.log

[Install]
WantedBy=multi-user.target
```

Reload systemd, start the service, and enable it to start on boot:

```bash
sudo systemctl daemon-reload
sudo systemctl start maas-proxmox-integration.service
sudo systemctl enable maas-proxmox-integration.service
```

## 3. MAAS Commissioning Script

This Bash script triggers the integration process during MAAS commissioning:

```bash
#!/usr/bin/env bash
#
# proxmox-maas-integration - Trigger Proxmox and MAAS integration
#
# --- Start MAAS 1.0 script metadata ---
# name: proxmox-maas-integration
# title: Proxmox and MAAS Integration
# description: Triggers Proxmox and MAAS integration process
# script_type: commissioning
# recommission: True
# timeout: 00:05:00
# packages:
#   apt:
#     - curl
# --- End MAAS 1.0 script metadata ---

# Retrieve the MAC address of the primary network interface
mac_address=$(ip link show | grep -Eo 'link/ether [^ ]+' | awk '{print $2}')

# Check if a MAC address was found
if [ -z "$mac_address" ]; then
    echo "No MAC address found. Exiting."
    exit 1
fi

# URL of the Flask service
FLASK_SERVICE_URL="http://<maas-ip-address/flash-vm-ip>:5000/update_maas"

# Trigger the integration process by calling the Flask endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" "${FLASK_SERVICE_URL}?mac_address=${mac_address}")

# Check the HTTP response code
if [ "$response" -eq 200 ]; then
    echo "Integration process triggered successfully."
else
    echo "Failed to trigger integration process. HTTP response code: $response"
    exit 1
fi
```

## 4. Convert custom commissioning script to default via sql

Use following sql script to update script status to default true. By doing this our custom script will run at node enlisting aka first commissioning.

```sql
UPDATE maasserver_script
SET "default"=true
WHERE name = 'proxmox-maas-integration'
```

## Conclusion

With these scripts and configurations, your home lab's Proxmox and MAAS integration will be automated efficiently. Adjust the script parameters, URLs, and credentials as needed to fit your environment. This setup ensures a smoother commissioning process and better management of your virtual and physical resources. Happy automating!
