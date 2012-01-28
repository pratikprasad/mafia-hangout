require 'rubygems'
require 'sinatra/base'

class MyApp < Sinatra::Base
  
  get "/" do 
    "learn your javascript"
  end

  run! if app_file == $0
end