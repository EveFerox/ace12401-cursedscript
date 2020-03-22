//************************************ MESSAGE CHECKER ************************************//
function AnalyzeMessage(msg) {
    // Parse needed data
    var originalContent = msg.textContent.split("(")[0].trim();
    var textmsg = originalContent.toLowerCase();
    var types = msg.classList;
    var sender = msg.getAttribute("data-sender");
    var chatroomMembers = ChatRoomCharacter.map(el => el.MemberNumber.toString());
    var commandCall = (cursedConfig.commandChar + cursedConfig.slaveIdentifier + " ").toLowerCase();
    var isMistress = cursedConfig.mistresses.includes(sender);
    var isOwner = cursedConfig.owners.includes(sender);
    var isOnEntry = types.contains("ChatMessageEnterLeave") && sender == Player.MemberNumber;
    var isActivated = !(cursedConfig.mistressIsHere && cursedConfig.disaledOnMistress)
        && ((cursedConfig.enabledOnMistress && cursedConfig.ownerIsHere) || !cursedConfig.enabledOnMistress)
    
    // Clears whisper text
    if (sender == Player.MemberNumber && (types.contains("ChatMessageWhisper") || types.contains("ChatMessageChat"))) {
        textmsg = textmsg.split(":")
        textmsg.shift();
        textmsg = textmsg.join(":");
    }
    
    // Clears stuttering
    textmsg = textmsg.replace(/[A-Za-z]-/g, "");
    
    // Checks if player should be kneeling
    if (
        types.contains("ChatMessageEnterLeave") && isOnEntry
        && sender != Player.MemberNumber && Player.CanKneel() && isActivated
    ) {
        if (
            [...cursedConfig.enforced, ...cursedConfig.mistresses, ...cursedConfig.owners]
                .includes(sender)
        ) {
            checkKneeling(sender);
        }
    }
    
    // Sends intro if the wearer has one
    if (isOnEntry && cursedConfig.hasEntryMsg && !cursedConfig.hasFullMuteChat && !cursedConfig.isMute && isActivated) {
        cursedConfig.say = cursedConfig.entryMsg;
        document.getElementById("InputChat").value = cursedConfig.entryMsg;
    }
    
    // Sends activated messages to an owner who enters or if the wearer entered
    if (types.contains("ChatMessageEnterLeave")) {
        if (cursedConfig.owners.includes(sender) && chatroomMembers.includes(sender)) {
            sendWhisper(sender, "(The curse is active on me... and you are amongst my owners... use it wisely.)");
        }
        if (sender == Player.MemberNumber) {
            chatroomMembers.forEach(el => {
                if (cursedConfig.owners.includes(el)) {
                    sendWhisper(el, "(The curse is active on me... and you are amongst my owners... use it wisely.)");
                }
            })
        }
    }
    
    // Checks for commands to change settings if able to, self is not able to do it
    if (
        (types.contains("ChatMessageChat") || types.contains("ChatMessageWhisper"))
        && textmsg.toLowerCase().indexOf(commandCall.toLowerCase()) != -1
        && cursedConfig.blacklist.indexOf(sender) == -1
    ) {
        // Parses the command
        var command;
        var parameters;
        try {
            var commandString = textmsg.split(commandCall)[1];
            command = commandString.split(" ")[0];
            parameters = commandString.split(" ");
            parameters.shift();//THROWS HERE IF COMMAND IS BAD
            
            //Defaults to on
            if (parameters.length == 0)
                parameters.push("on");
            
            //Wearer only command
            if (sender == Player.MemberNumber) {
                WearerCommands(
                    command, sender, commandCall, originalContent, textmsg, types, sender, chatroomMembers, commandCall, isMistress, isOwner, isOnEntry, isActivated, parameters
                );
                //Quit loop to prevent wearer from doing the rest (can't add self as owner)
                return;
            }
            
            // Verifies owner for private commands
            // Checks if public has access or mistress can do all
            if (isOwner) {
                OwnerCommands(
                    command, sender, commandCall, originalContent, textmsg, types, sender, chatroomMembers, commandCall, isMistress, isOwner, isOnEntry, isActivated, parameters
                );
            }
            
            //Verify mistress for private commands
            if (isMistress || isOwner) {
                MistressCommands(
                    command, sender, commandCall, originalContent, textmsg, types, sender, chatroomMembers, commandCall, isMistress, isOwner, isOnEntry, isActivated, parameters
                );
            }
            
            // Checks if public has access or mistress can do all
            if (cursedConfig.hasPublicAccess || isMistress || isOwner) {
                PublicCommands(
                    command, sender, commandCall, originalContent, textmsg, types, sender, chatroomMembers, commandCall, isMistress, isOwner, isOnEntry, isActivated, parameters
                );
            }
        
        } catch (err) { console.log(err) }
        
    } else if (isActivated) {
        //Checks if settings are respected otherwise
        //Cursed collar
        if (
            cursedConfig.hasCursedKneel
            && Player.CanKneel()
            && !Player.Pose.includes("Kneel")
        ) {
            SendChat("The cursed collar on " + Player.Name + "'s neck gives her an extreme shock, forcing her to get on her knees.");
            triggerInPain();
            KneelAttempt();
            cursedConfig.strikes++;
        }
    
        //Cursed Items
        if (
            cursedConfig.hasCursedBelt
            && !(InventoryGet(Player, "ItemPelvis")
                && InventoryGet(Player, "ItemPelvis").Asset
                && InventoryGet(Player, "ItemPelvis").Asset.Name == "PolishedChastityBelt")
            && itemIsAllowed("PolishedChastityBelt", "ItemPelvis")
        ) {
            SendChat("The cursed chastity belt on " + Player.Name + " reappears.");
            procGenericItem("PolishedChastityBelt", "ItemPelvis");
            cursedConfig.strikes += 5;
        }
    
        if (
            cursedConfig.hasCursedGag
            && !(InventoryGet(Player, "ItemMouth")
                && InventoryGet(Player, "ItemMouth").Asset
                && InventoryGet(Player, "ItemMouth").Asset.Name == "BallGag")
            && itemIsAllowed("BallGag", "ItemMouth")
        ) {
            SendChat("The cursed gag on " + Player.Name + " reappears.");
            procGenericItem("BallGag", "ItemMouth");
            cursedConfig.strikes += 5;
        }
    
        if (
            cursedConfig.hasCursedMittens
            && !(InventoryGet(Player, "ItemHands")
                && InventoryGet(Player, "ItemHands").Asset
                && InventoryGet(Player, "ItemHands").Asset.Name == "LeatherMittens")
            && itemIsAllowed("LeatherMittens", "ItemHands")
        ) {
            SendChat("The cursed mittens on " + Player.Name + " reappears.");
            procGenericItem("LeatherMittens", "ItemHands");
            cursedConfig.strikes += 5;
        }
    
        if (
            cursedConfig.hasCursedBlindfold
            && !(InventoryGet(Player, "ItemHead")
                && InventoryGet(Player, "ItemHead").Asset
                && InventoryGet(Player, "ItemHead").Asset.Name == "FullBlindfold")
            && itemIsAllowed("FullBlindfold", "ItemHead")
        ) {
            SendChat("The cursed blindfold on " + Player.Name + " reappears.");
            procGenericItem("FullBlindfold", "ItemHead");
            cursedConfig.strikes += 5;
        }
    
        if (
            cursedConfig.hasCursedHood
            && !(InventoryGet(Player, "ItemHead")
                && InventoryGet(Player, "ItemHead").Asset
                && InventoryGet(Player, "ItemHead").Asset.Name == "LeatherHoodSensDep")
            && itemIsAllowed("LeatherHoodSensDep", "ItemHead")
        ) {
            SendChat("The cursed VR Hood on " + Player.Name + " reappears.");
            procGenericItem("LeatherHoodSensDep", "ItemHead");
            cursedConfig.strikes += 5;
        }
    
        if (
            cursedConfig.hasCursedEarplugs
            && !(InventoryGet(Player, "ItemEars")
                && InventoryGet(Player, "ItemEars").Asset
                && InventoryGet(Player, "ItemEars").Asset.Name == "HeavyDutyEarPlugs")
            && itemIsAllowed("HeavyDutyEarPlugs", "ItemEars")
        ) {
            SendChat("The cursed earplugs on " + Player.Name + " reappears.");
            procGenericItem("HeavyDutyEarPlugs", "ItemEars");
            cursedConfig.strikes += 5;
        }
    
        if (
            cursedConfig.hasCursedDildogag
            && !(InventoryGet(Player, "ItemMouth")
                && InventoryGet(Player, "ItemMouth").Asset
                && InventoryGet(Player, "ItemMouth").Asset.Name == "DildoPlugGag")
            && itemIsAllowed("DildoPlugGag", "ItemMouth")
        ) {
            SendChat("The cursed dildo finds its way back into " + Player.Name + "'s mouth.");
            procGenericItem("DildoPlugGag", "ItemMouth");
            cursedConfig.strikes += 5;
        }
    
        if (
            cursedConfig.hasCursedPanties
            && !(InventoryGet(Player, "ItemMouth")
                && InventoryGet(Player, "ItemMouth").Asset
                && InventoryGet(Player, "ItemMouth").Asset.Name == "PantyStuffing")
            && itemIsAllowed("PantyStuffing", "ItemMouth")
        ) {
            SendChat("The cursed panties find their way back into " + Player.Name + "'s mouth .");
            procGenericItem("PantyStuffing", "ItemMouth");
            cursedConfig.strikes += 5;
        }
    
        //Cursed nakedness
        if (
            cursedConfig.hasCursedNakedness
            && (InventoryGet(Player, "Cloth")
                || InventoryGet(Player, "ClothLower")
                || InventoryGet(Player, "ClothAccessory")
                || InventoryGet(Player, "Suit")
                || InventoryGet(Player, "SuitLower")
                || InventoryGet(Player, "Bra")
                || InventoryGet(Player, "Panties")
                || InventoryGet(Player, "Socks")
                || InventoryGet(Player, "Shoes")
                || InventoryGet(Player, "Hat")
                || InventoryGet(Player, "Gloves")
            )) {
            SendChat("The curse on " + Player.Name + " makes her clothes vanish mysteriously.");
            procCursedNaked();
            cursedConfig.strikes++;
        }
    
        //Cursed Speech
        if (
            cursedConfig.hasCursedSpeech
            && sender == Player.MemberNumber
            && textmsg.indexOf("silent: *") == -1
            && cursedConfig.bannedWords
                .filter(word =>
                    textmsg.toLowerCase().split(" ").includes(word.toLowerCase())
                ).length != 0
        ) {
            SendChat(Player.Name + " angers the curse on her.");
            popChatSilent("Bad girl. You used a banned word.");
            cursedConfig.strikes += 5;
        }
    
        //Cursed Orgasms
        if (
            cursedConfig.hasCursedOrgasm
            && (!InventoryGet(Player, "ItemButt")
                || !InventoryGet(Player, "ItemVulva")
                || !InventoryGet(Player, "ItemNipples")
                || !InventoryGet(Player, "ItemVulvaPiercings")
                || !InventoryGet(Player, "ItemNipplesPiercings")
                || (
                    InventoryGet(Player, "ItemButt").Asset.Name == "InflVibeButtPlug"
                    && (InventoryGet(Player, "ItemButt").Property.Intensity != 4
                        || InventoryGet(Player, "ItemButt").Property.InflateLevel != 4)
                ) || (
                    InventoryGet(Player, "ItemVulva").Asset.Name == "InflatableVibeDildo"
                    && (InventoryGet(Player, "ItemVulva").Property.Intensity != 4
                        || InventoryGet(Player, "ItemVulva").Property.InflateLevel != 4)
                ) || (
                    InventoryGet(Player, "ItemNipples").Asset.Name == "TapedVibeEggs"
                    && InventoryGet(Player, "ItemNipples").Property.Intensity != 4
                ) || (
                    InventoryGet(Player, "ItemVulvaPiercings").Asset.Name == "VibeHeartClitPiercing"
                    && InventoryGet(Player, "ItemVulvaPiercings").Property.Intensity != 4
                ) || (
                    InventoryGet(Player, "ItemNipplesPiercings").Asset.Name == "VibeHeartPiercing"
                    && InventoryGet(Player, "ItemNipplesPiercings").Property.Intensity != 4
                )
            )) {
            if (
                itemIsAllowed("VibeHeartPiercing", "ItemNipplesPiercings") &&
                itemIsAllowed("VibeHeartClitPiercing", "ItemVulvaPiercings") &&
                itemIsAllowed("TapedVibeEggs", "ItemNipples") &&
                itemIsAllowed("InflatableVibeDildo", "ItemVulva") &&
                itemIsAllowed("InflVibeButtPlug", "ItemButt")
            ) {
                SendChat("The curse on " + Player.Name + " brings the vibrators back to their maximum intensity.");
                procCursedOrgasm();
                cursedConfig.strikes++;
            }
        }
    
        //Cursed latex
        if (
            cursedConfig.hasCursedLatex
            && (!InventoryGet(Player, "Gloves")
                || !InventoryGet(Player, "Suit")
                || !InventoryGet(Player, "SuitLower")
                || InventoryGet(Player, "Gloves").Asset.Name != "Catsuit"
                || InventoryGet(Player, "Suit").Asset.Name != "Catsuit"
                || InventoryGet(Player, "SuitLower").Asset.Name != "Catsuit"
            )) {
            SendChat("The cursed latex embraces " + Player.Name + ".");
            procCursedLatex();
            cursedConfig.strikes += 2;
        }
    
        //Stuff that only applies to self
        if (sender == Player.MemberNumber) {
            //Reinforcement
            cursedConfig.enforced.forEach(memberNumber => {
                if (ChatRoomCharacter.map(el => el.MemberNumber.toString()).includes(memberNumber) && textmsg.indexOf("silent: *") == -1) {
                    var Name = ChatRoomCharacter
                        .map(el => { return { MemberNumber: el.MemberNumber, Name: el.Name } })
                        .filter(el => el.MemberNumber == memberNumber)[0].Name;
                    var requiredName = ['miss', 'mistress', 'goddess', 'owner']
                        .map(el => el + " " + Name.toLowerCase());
            
                    var matches = [[...textmsg
                        .matchAll(new RegExp("\\b(" + Name.toLowerCase() + ")\\b", 'g'))
                    ]];
                    if (!matches) matches = [];
                    var goodMatches = [];
                    requiredName.forEach(rn =>
                        goodMatches.push([...textmsg.matchAll(new RegExp(rn, 'g'))])
                    )
            
                    if (matches[0].length > goodMatches.filter(el => el.length > 0).length) {
                        SendChat(Player.Name + " angers the curse on her with her lack of respect.");
                        popChatSilent("Respecting " + memberNumber + " is required.");
                        cursedConfig.strikes += 7;
                    }
                }
            });
        
            //Mute
            if (cursedConfig.isMute && textmsg.length != 0 && types.contains("ChatMessageChat")) {
                SendChat(Player.Name + " angers the curse by speaking when she is not allowed to.");
                cursedConfig.strikes += 5;
            }
        
            //Should say
            if (cursedConfig.say != "" && types.contains("ChatMessageChat") && !cursedConfig.hasFullMuteChat) {
                if (
                    textmsg.trim() != cursedConfig.say.toLowerCase().trim()
                    && Player.Effect.filter(ef => ef.indexOf("Gag") != -1).length == 0
                ) {
                    console.log(textmsg, cursedConfig.say.toLowerCase().trim());
                    popChatSilent("You were punished for not saying the expected sentence willingly: " + cursedConfig.say);
                    document.getElementById("InputChat").value = cursedConfig.say;
                    cursedConfig.strikes += 2;
                } else {
                    cursedConfig.say = "";
                }
            }
        }
    }
}