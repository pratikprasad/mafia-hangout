#game.rb

class Player
  attr_reader :id, :role

  def initialize(playerID)
    @id = playerID  
  end

  def addRole(role)
    @role = role
  end

end

class Game

  attr_reader :numMafia

  def initialize(gameID, numPlayers)
    @id = gameID
    @numPlayers = numPlayers
    @players = []
    @roles = []
    @numMafia = (numPlayers.size.to_f)*(3.0/10.0)
    @numMafia = numMafia.to_i
    @numMafia.times{
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
    # assign first role from front of roles list
    role = @roles.delete_at(0)
    player.addRole(role)
    role
  end

  def decrementNumMafia
    @numMafia -= 1
    @numMafia
  end
end