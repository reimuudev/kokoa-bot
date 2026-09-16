import http from 'http';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

// Servidor HTTP falso para Render Free
http.createServer((req, res) => res.end('Bot activo 24/7')).listen(process.env.PORT || 3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 1. Comandos
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

// 2. Registro al iniciar
client.once('ready', async () => {
  console.log(`¡Bot encendido como ${client.user.tag}!`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Comandos registrados exitosamente.');
  } catch (error) {
    console.error('Error al registrar comandos:', error);
  }
});

// 3. Manejo con deferReply()
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, channel } = interaction;

  // Función para consultar API de GIFs
  const getWaifuGif = async (type, category = 'sfw') => {
    try {
      const res = await fetch(`https://api.waifu.pics/${category}/${type}`);
      const data = await res.json();
      return data.url;
    } catch {
      return null;
    }
  };

  // Comandos de Interacción
  if (['hug', 'kiss', 'pat'].includes(commandName)) {
    // Avisa inmediatamente a Discord que el bot está procesando
    await interaction.deferReply();

    const target = options.getUser('usuario');
    const imageUrl = await getWaifuGif(commandName, 'sfw');
    
    if (!imageUrl) {
      return interaction.editReply('❌ Ocurrió un error al obtener la imagen. Intenta de nuevo.');
    }

    const actionText = {
      hug: `¡${interaction.user} le dio un abrazo a ${target}! 🫂`,
      kiss: `¡${interaction.user} le dio un beso a ${target}! 💋`,
      pat: `¡${interaction.user} le dio una caricia a ${target}! ✨`
    };

    const embed = new EmbedBuilder()
      .setDescription(actionText[commandName])
      .setImage(imageUrl)
      .setColor('#FFB6C1');

    return interaction.editReply({ embeds: [embed] });
  }

  // Comando SFW Neko
  if (commandName === 'neko') {
    await interaction.deferReply();
    const imageUrl = await getWaifuGif('neko', 'sfw');
    if (!imageUrl) return interaction.editReply('❌ Error al obtener la imagen.');

    const embed = new EmbedBuilder().setImage(imageUrl).setColor('#FFC0CB');
    return interaction.editReply({ embeds: [embed] });
  }

  // Comando NSFW
  if (commandName === 'nsfw') {
    if (!channel.nsfw) {
      return interaction.reply({ 
        content: '❌ Este comando solo se puede utilizar en canales marcados como **NSFW (Mayores de 18)**.', 
        ephemeral: true 
      });
    }

    await interaction.deferReply();
    const imageUrl = await getWaifuGif('waifu', 'nsfw');
    if (!imageUrl) return interaction.editReply('❌ Error al obtener la imagen.');

    const embed = new EmbedBuilder()
      .setTitle('🔥 Contenido NSFW')
      .setImage(imageUrl)
      .setColor('#FF0000');

    return interaction.editReply({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
