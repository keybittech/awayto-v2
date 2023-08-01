#!/usr/bin/expect

# Now spawn the sign-req command
spawn ./easyrsa sign-req server $env(SERVER_NAME)

expect "Confirm request details:"
send -- "yes\r"

expect "Enter pass phrase for /home/$env(TAILSCALE_OPERATOR)/easy-rsa/pki/private/ca.key:"
send -- "$env(CA_PASS)\r"

# Expect end of the program
expect eof
