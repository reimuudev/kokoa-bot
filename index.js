import http from 'http';
http.createServer((req, res) => res.end('Bot activo 24/7')).listen(process.env.PORT || 3000);

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import process from 'node.process';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 1. Definición de comandos de interacción, reacción y NSFW
const commands = [
  new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Abraza a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién quieres abrazar').setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Besa a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién quieres besar').setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('pat')
    .setDescription('Acaricia a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién quieres acariciar').setRequired(true)),

  new SlashCommandBuilder()
    .setName('neko')
    .setDescription('Muestra una imagen SFW de una chica gato'),

  new SlashCommandBuilder()
    .setName('nsfw')
    .setDescription('Muestra una imagen anime NSFW (Solo canales NSFW)')
].map(cmd => cmd.toJSON());

// 2. Registro de comandos al iniciar
client.once('ready', async () => {
  console.log(`¡Bot encendido como ${client.user.tag}!`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Comandos registrados exitosamente globalmente.');
  } catch (error) {
    console.error('Error al registrar comandos:', error);
  }
});

// 3. Manejo de las interacciones
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, channel } = interaction;

  // Función auxiliar para obtener GIFs de la API Waifu.pics
  const getWaifuGif = async (type, category = 'sfw') => {
    const res = await fetch(`https://api.waifu.pics/${category}/${type}`);
    const data = await res.json();
    return data.url;
  };

  // Comandos de Interacción (SFW)
  if (['hug', 'kiss', 'pat'].includes(commandName)) {
    const target = options.getUser('usuario');
    const imageUrl = await getWaifuGif(commandName, 'sfw');
    
    const actionText = {
      hug: `¡${interaction.user} le dio un abrazo a ${target}! 🫂`,
      kiss: `¡${interaction.user} le dio un beso a ${target}! 💋`,
      pat: `¡${interaction.user} le dio una caricia a ${target}! ✨`
    };

    const embed = new EmbedBuilder()
      .setDescription(actionText[commandName])
      .setImage(imageUrl)
      .setColor('#FFB6C1');

    return interaction.reply({ embeds: [embed] });
  }

  // Comando SFW Neko
  if (commandName === 'neko') {
    const imageUrl = await getWaifuGif('neko', 'sfw');
    const embed = new EmbedBuilder().setImage(imageUrl).setColor('#FFC0CB');
    return interaction.reply({ embeds: [embed] });
  }

  // Comando NSFW con validación de canal
  if (commandName === 'nsfw') {
    if (!channel.nsfw) {
      return interaction.reply({ 
        content: '❌ Este comando solo se puede utilizar en canales marcados como **NSFW (Mayores de 18)**.', 
        ephemeral: true 
      });
    }

    const imageUrl = await getWaifuGif('waifu', 'nsfw');
    const embed = new EmbedBuilder()
      .setTitle('🔥 Contenido NSFW')
      .setImage(imageUrl)
      .setColor('#FF0000');

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
