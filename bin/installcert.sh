#!/usr/bin/expect

# Set environment variables
set TAILSCALE_OPERATOR $env(TAILSCALE_OPERATOR)
set CA_PASS $env(CA_PASS)
set SERVER_NAME $env(SERVER_NAME)

# Spawn the EasyRSA gen-req command
spawn /home/$TAILSCALE_OPERATOR/easy-rsa/easyrsa gen-req $SERVER_NAME nopass
expect eof

# We don't expect any output or interaction here

# Now spawn the sign-req command
spawn /home/$TAILSCALE_OPERATOR/easy-rsa/easyrsa sign-req server $SERVER_NAME

expect "Enter pass phrase for /home/$TAILSCALE_OPERATOR/easy-rsa/pki/private/ca.key:"
send -- "${CA_PASS}\r"

# Expect end of the program
expect eof
