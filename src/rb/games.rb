#game.rb

class Player
  attr_reader :id

  def initialize(playerID)
    @id = playerID  
  end

  def addRole(role)
    @role = role
  end

end

class Game
  def initialize(gameID, numPlayers)
    @id = gameID
    @numPlayers = numPlayers
    @players = []
    @roles = []
    (numPlayers.size.to_f)*(3.0/10.0).to_i.times{
      @roles << "mafia"
    }
    while @roles.size < numPlayers do 
      @roles << "villager"
    end
    @roles.shuffle
  end

  def ready?
    return @players.size == numPlayers
  end

  def addPlayer(player)
    @players << player
  end

  # assign first role from front of roles list
  def assign_role(player)
    player.assign_role(@roles.delete_at(0))
  end

end