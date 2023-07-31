#!/usr/bin/expect

# Set environment variables
set env(EASYRSA_REQ_CN) "$::env(SERVER_NAME)"
set operator $::env(TAILSCALE_OPERATOR)
set CA_PASS $::env(CA_PASS)
set SERVER_NAME $::env(SERVER_NAME)

# Spawn the EasyRSA gen-req command
spawn /home/$operator/easy-rsa/easyrsa gen-req $SERVER_NAME nopass

# We don't expect any output or interaction here

# Now spawn the sign-req command
spawn echo $CA_PASS | /home/$operator/easy-rsa/easyrsa sign-req server $SERVER_NAME

# Listen for the confirmation prompt
expect "Confirm request details:"

# Send "yes" and a newline (\n)
send -- "yes\r"

# Expect end of the program
expect eof
