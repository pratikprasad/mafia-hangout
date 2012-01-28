require 'rubygems'
require 'sinatra/base'

class Mafia < Sinatra::Base
  
  get "/" do 
    "learn your javascript"
  end

  put "/newGame/:gameID/:numPlayers" do
    "adfadsfgit"
  end

  put "/addPlayer/:gameID/:playerID" do
    "waynee?"
  end

  get "/getRole/:gameID/:playerID" do 
    "waynee?"
  end

  put "/decrement/:gameID" do 
    if !@rand then 
      @rand = 100 
    end
    @rand -= 1
    @rand
  end

  get "/numMafia/:gameID" do 
    if @rand then 
      @rand
    else
      42
    end
  end

  run! if app_file == $0
end