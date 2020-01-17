const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

// Controller tem 5 funções no maximo

// index: mostrar uma lista
// show: mostrar um unico dev
// store criar um dev 
// update: atualizar um dev 
// destroy: deletar um dev

module.exports = {
  async index(request, response) {
    const devs = await Dev.find();

    return response.json(devs);
  },

  async store(request, response) {
    const { github_username, techs, latitude, longitude } = request.body;

    let dev = await Dev.findOne({ github_username });

    if (dev) {
      return response.status(400).json({ message: 'Dev already exists' })
    }

    const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);

    const { name = login, avatar_url, bio } = apiResponse.data;

    const techsArray = parseStringAsArray(techs);

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    dev = await Dev.create({
      github_username,
      name,
      avatar_url,
      bio,
      techs: techsArray,
      location
    });

    // Filtrar as conexões que estão no maximo a 10km
    // e que o novo dev tenha uma das tecnologias filtradas

    const sendSocketMessageTo = findConnections(
      { latitude, longitude },
      techsArray
    )

    sendMessage(sendSocketMessageTo, 'new-dev', dev)

    return response.json(dev);
  },

  async update() {
    // atualizar name, techs, avatar_url, bio 

  },

  async destroy() {
    // deletar dev do banco de dados

  },
}