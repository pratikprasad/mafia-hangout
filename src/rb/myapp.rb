require 'rubygems'
require 'sinatra/base'
require './games'

DIR = "/home/ec2-user/mafia-hangout/src/js"

class Mafia < Sinatra::Base
  
  get "/files/:file" do |filename|
    send_file File.join(DIR, filename)
  end

  get "/" do 
    "learn your javascript"
  end

  get "/newGame/:gameID/:numPlayers" do |gameID, numPlayers|
    if !@games then 
      @games = {}
    end
    @games[gameID] = Game.new(gameID.to_i,numPlayers.to_i)
    "Game created with ID #{gameID}"
  end

  get "/addPlayer/:gameID/:playerID" do |gameID, playerID|
    if game = @games[gameID] then
      player = Player.new(playerID)
      game.addPlayer(player).to_s
    else
      "No such Game"
    end
  end

  get "/getRole/:gameID/:playerID" do |gameID, playerID|
    
  end

  #decrement the amount of mafia members alive
  get "/decrement/:gameID" do |gameID|
    @games[gameID].decrementNumMafia().to_s
  end

  get "/numMafia/:gameID" do |gameID|
    @games[gameID].numMafia().to_s
  end

  run! if app_file == $0
end