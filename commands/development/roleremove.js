const { fail } = require('assert');
const { SlashCommandBuilder, AutoModerationRuleKeywordPresetType } = require('discord.js');
const { link } = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleremove')
        .setDescription('Removes a role in all discords')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove the role from')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove in all servers')
                .setRequired(true)),
    async execute(config, interaction) {
        const linkedRoles = require('./linkedRoles.json');
        if (interaction.guild.id !== "1323763034488963143") {
            return await interaction.reply("That command can only be executed in the main server.");
        }

        if (!interaction.member.roles.cache.has('1358989284039852136')) {
            return await interaction.reply("You must be a member of the Board of Directors to execute that command");
        }

        const targetUser = interaction.options.getUser('user');
        const targetRole = interaction.options.getRole('role');

        let linked = false;
        let targetLinkIndex = null;

        for (let linkIndex in linkedRoles.links) {
            for (let roleIndex in linkedRoles.links[linkIndex].roles) {
                const roleObj = linkedRoles.links[linkIndex].roles[roleIndex];
                if (
                    roleObj.guildId === interaction.guild.id &&
                    roleObj.roleId === targetRole.id
                ) {
                    linked = true;
                    targetLinkIndex = linkIndex;
                    break;
                }
            }
            if (linked) break;
        }

        if (!linked) return await interaction.reply("This role is not linked.");
        if (targetLinkIndex === null) return await interaction.reply("Internal error.");

        await interaction.reply(`Starting role removal for **${targetUser.username}**...`);

        let successCounter = 0;
        let failureCounter = 0;
        const errors = [];

        const promises = linkedRoles.links[targetLinkIndex].roles.map(async (roleInfo) => {
            try {
                const guild = await interaction.client.guilds.fetch(roleInfo.guildId).catch(() => null);
                if (!guild) {
                    errors.push(`❌ Failed to fetch guild ID \`${roleInfo.guildId}\``);
                    failureCounter++;
                    return;
                }

                const member = await guild.members.fetch(targetUser.id).catch(() => null);
                if (!member) {
                    errors.push(`❌ ${targetUser.username} not found in **${guild.name}**`);
                    failureCounter++;
                    return;
                }

                const role = guild.roles.cache.get(roleInfo.roleId);
                if (!role) {
                    errors.push(`❌ Role not found in **${guild.name}**`);
                    failureCounter++;
                    return;
                }

                await member.roles.remove(role);
                successCounter++;
            } catch (err) {
                console.error(`Error in guild ${roleInfo.guildId}:`, err);
                errors.push(`❌ \`${err.message}\` in guild ID \`${roleInfo.guildId}\``);
                failureCounter++;
            }
        });

        await Promise.all(promises);

        const summary = `✅ Role removed in **${successCounter}** server(s).\n❌ Failed in **${failureCounter}** server(s).`;

        const fullMessage = errors.length > 0
            ? `${summary}\n\nErrors:\n${errors.join("\n")}`
            : summary;

        return await interaction.followUp(fullMessage);
    }
};
