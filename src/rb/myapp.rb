require 'rubygems'
require 'sinatra/base'

class Mafia < Sinatra::Base
  
  get "/" do 
    "learn your javascript"
  end

  get "/newGame/:gameID/:numPlayers" do
    "adfadsfgit"
  end

  get "/addPlayer/:gameID/:playerID" do
    "waynee?"
  end

  get "/getRole/:gameID/:playerID" do 
    "waynee?"
  end

# to fix this shit
  get "/decrement/:gameID" do 
    "asdf"
  end

  get "/numMafia/:gameID" do 
    "adsf"    
  end

  run! if app_file == $0
end