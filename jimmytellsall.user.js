// ==UserScript==
// @name         Jimmy Tells All
// @version      0.3.2r+
// @description  Jimmy displays the name of his target and his current speed and plays warning sound
// @include      http://tangent.jukejuice.com:*
// @include      http://*.newcompte.fr:*
// @match        *://*.koalabeast.com/game
// @author       Some Ball -1, Catalyst, Ronding, Jason Bourne
// @grant        none
// ==/UserScript==

var Jimmy=false;
tagpro.ready(function() {
    function addCircle() {
        if(tagpro.spectator || !tagpro.players[tagpro.playerId] || !tagpro.players[tagpro.playerId].sprites || !tagpro.players[tagpro.playerId].sprites.ball) return setTimeout(addCircle,100);
        var circle = new PIXI.Graphics();
        circle.position = new PIXI.Point(20,20);
        circle.beginFill('0xffffff').drawCircle(0,0,280).alpha = 0.1; //7 tiles*40 pixels = 280 pixel radius
        tagpro.players[tagpro.playerId].sprites.ball.addChildAt(circle,0);
    }
    tagpro.socket.on('map', function(data) {
        console.log("Map is: " + data.info.name);
        if (/^Jimmy/.test(data.info.name)){
            Jimmy=true;
            addCircle();
        }
    });
    var sprite;
    if (!sprite) {
        sprite = new PIXI.Text(
          '',
          {
            fontSize:        "16pt",
            strokeThickness: 3,
            fill:            "#ffffff",
            fontWeight:      "bold",
          }
        );
      sprite.x   = 10;
      sprite.y   = 30;
      tagpro.renderer.layers.ui.addChild(sprite);
    }
    sprite.text = "Target: Georgie #spookyszn";
    var chasetext = new PIXI.Text('[Unknown]',{
        fill: 'white',
        stroke: 'black',
        strokeThickness: 2
    });
    var speedtext = new PIXI.Text('[Unknown]',{
        fill: 'white',
        stroke: 'black',
        strokeThickness: 2,
        fontSize: 20,
        fontFamily: 'Arial'
    });
    chasetext.visible = speedtext.visible = false;
    chasetext.anchor.x = chasetext.anchor.y = 0.5;
    speedtext.anchor.x = speedtext.anchor.y = 0.5;
    tagpro.renderer.layers.foreground.addChild(chasetext);
    tagpro.renderer.layers.foreground.addChild(speedtext);
    var chasing = {};
    tagpro.socket.on('chasing',function(e) {
        chasing = e;
    });
    var lastChasingId=-1;
    var umb = tagpro.renderer.updateMarsBall;
    tagpro.renderer.updateMarsBall = function(object) {
        if(chasing.id && chasing.speed && object.sprite) {
            if(tagpro.renderer.layers.foreground.getChildIndex(speedtext)<tagpro.renderer.layers.foreground.children.length-1) {
                tagpro.renderer.layers.foreground.addChild(chasetext);
                tagpro.renderer.layers.foreground.addChild(speedtext);
            }
            chasetext.position = new PIXI.Point(object.sprite.x+40, object.sprite.y+20);
            speedtext.position = new PIXI.Point(object.sprite.x+40, object.sprite.y+60);
            chasetext.visible = speedtext.visible = object.draw;
            var player = tagpro.players[chasing.id];
            if(player) {
                var color = 'white';
                if(chasing.id===tagpro.playerId && !tagpro.spectator) {
                    if(chasing.id!=lastChasingId) tagpro.playSound('alertlong');
                    color = 'yellow';
                }
                else if(player.auth) color = '#BFFF00';
                chasetext.style={
                    fill: color,
                    stroke: 'black',
                    strokeThickness: 2
                };
                chasetext.text=player.name;
                speedtext.text=Math.round(chasing.speed*10000);
                lastChasingId=chasing.id;
            }
        }
        return umb.apply(this,arguments);
    };
    document.addEventListener('keydown', keydownHandler, false);

    function keydownHandler(event) {
        var code = event.keyCode || event.which;
        var chatMessage = "doot doot"
        if (code==74 && !tagpro.disableControls && chasing.id) {
            chatMessage = "Jimmy is chasing " + tagpro.players[chasing.id].name;
            sprite.text = "Target: " + tagpro.players[chasing.id].name;
            tagpro.socket.emit("chat", {message: chatMessage,toAll: 0});
        }
        if (code==75 && !tagpro.disableControls) {
            tagpro.socket.emit("chat", {message: chatMessage,toAll: 1});
        }
        if ((code==37 || code==38 || code==39 || code==40 || code==65 || code==68 || code==83 || code==87) && !tagpro.disableControls && chasing.id) {
            sprite.text = "Target: " + tagpro.players[chasing.id].name;
        }
    }
});
