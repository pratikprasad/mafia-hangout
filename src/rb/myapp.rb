require 'rubygems'
require 'sinatra/base'

class Mafia < Sinatra::Base
  
  get "/" do 
    "learn your javascript"
  end

  put "/newGame/:gameID/:numPlayers" do
    "adfadsfgit"
  end

  get "/getRole/:gameID/:playerID" do 

  end

  put "/:gameID/decrement"
    gameID%21
  end

  run! if app_file == $0
end