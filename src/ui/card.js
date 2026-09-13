const {ContainerBuilder,TextDisplayBuilder,SeparatorBuilder,MediaGalleryBuilder,MediaGalleryItemBuilder,ButtonBuilder,ButtonStyle,ActionRowBuilder}=require('discord.js');
const theme=require('./theme');
function card(title,description='',color=theme.primary,avatar){const c=new ContainerBuilder();c.setAccentColor(color);c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}\n${description}`));if(avatar){c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(avatar)));}return c;}
function buttons(items){return new ActionRowBuilder().addComponents(items.map(x=>new ButtonBuilder().setCustomId(x.id).setLabel(x.label).setStyle(x.style||ButtonStyle.Secondary).setDisabled(!!x.disabled)));}
module.exports={card,buttons};
