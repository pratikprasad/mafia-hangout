require 'rubygems'
require 'sinatra/base'

class Mafia < Sinatra::Base
  
  get "/" do 
    "learn your javascript"
  end

  put "/newGame/:gameID/:numPlayers" do
    "adfadsf"
  end

  get "/getRole/:gameID/:playerID" do 

  run! if app_file == $0
end