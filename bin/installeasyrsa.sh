#!/usr/bin/expect -f

set timeout -1
set password $env(CA_PASSWORD)
puts "Password is $password"

puts "Spawning easyrsa"
spawn ~/easy-rsa/easyrsa build-ca

expect "Enter New CA Key Passphrase: "
send -- "$password\r"

expect "Re-Enter New CA Key Passphrase: "
send -- "$password\r"
expect eof
