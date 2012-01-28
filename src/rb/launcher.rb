# launcher.rb

cmd = "sudo rackup -p 80"

child = fork do 
  exec `cmd`
end