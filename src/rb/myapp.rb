require 'rubygems'
require 'sinatra/base'

class MyApp < Sinatra::base
  
  get "/" do 
    "learn your javascript"
  end

  run! if app_file == $0
end