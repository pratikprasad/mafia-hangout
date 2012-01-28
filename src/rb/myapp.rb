require 'rubygems'
require 'sinatra/base'
require './games'

DIR = "/home/ec2-user/mafia-hangout/src/js"

class Mafia < Sinatra::Base
  
  def initialize
    @games = {}
  end

  get "/files/:file" do |filename|
    send_file File.join(DIR, filename)
  end

  get "/" do 
    "learn your javascript"
  end

  get "/newGame/:gameID/:numPlayers" do
    @games[gameID] = Game.new(gameID,numPlayers)
    @games[gameID].to_s
  end

  get "/addPlayer/:gameID/:playerID" do
    if game = @games[gameID] then

    else
      "no such game"
    end
  end

  get "/getRole/:gameID/:playerID" do 
    "waynee?"
  end

  get "/decrement/:gameID" do 
    "asdf"
  end

  get "/numMafia/:gameID" do 
    "adsf"    
  end

  run! if app_file == $0
end