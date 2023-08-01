#!/usr/bin/expect

# Now spawn the sign-req command
spawn ./easyrsa sign-req server $env(SERVER_NAME)

expect "Confirm request details:"
send -- "yes\r"

# Expect end of the program
expect eof
