require 'rubygems'
require 'sinatra/base'
require './games'
require 'pstore'

DIR = "/home/ec2-user/mafia-hangout/src/js"
STORE = "/home/ec2-user/mafia-hangout/store"

class Mafia < Sinatra::Base
  
  def getGame(id)
    store = PStore.new(STORE)
    store.transaction{
      store[id]
    }
  end

  def setGame(id,game)
    store = PStore.new(STORE)
    store.transaction{
      store[id] = game
    }
  end

  get "/files/:file" do |filename|
    send_file File.join(DIR, filename)
  end

  get "/" do 
    "learn your javascript"
  end

  get "/newGame/:gameID/:numPlayers" do |gameID, numPlayers|
    
    game = Game.new(gameID.to_i,numPlayers.to_i)
    setGame(gameID, game)
    "Game created with ID #{gameID}"
  end

  get "/addPlayer/:gameID/:playerID" do |gameID, playerID|
    if game = getGame(gameID) then
      player = Player.new(playerID)
      val = game.addPlayer(player).to_s
      setGame(gameID,game)
      val
    else
      "No such Game"
    end
  end

  get "/getRole/:gameID/:playerID" do |gameID, playerID|
    
  end

  #decrement the amount of mafia members alive
  get "/decrement/:gameID" do |gameID|
    game = getGame(gameID)
    val = game.decrementNumMafia().to_s
    setGame(gameID,game)
    val
  end

  get "/numMafia/:gameID" do |gameID|
    game = getGame(gameID)
    val = game.numMafia().to_s
    setGame(gameID,game)
    val
  end

  run! if app_file == $0
end