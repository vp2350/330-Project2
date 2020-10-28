/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData, image;

function setupCanvas(canvasElement,analyserNodeRef){
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// create a gradient that runs top to bottom
	gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"blue"},{percent:.25,color:"green"},{percent:.5,color:"yellow"},{percent:.75,color:"red"},{percent:1,color:"magenta"}]);
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;
	// this is the array where the analyser data will be stored
	audioData = new Uint8Array(analyserNode.fftSize/2);

}

function draw(params={}){
  // 1 - populate the audioData array with the frequency data from the analyserNode
	// notice these arrays are passed "by reference" 
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
	if(params.useWaveForm) analyserNode.getByteTimeDomainData(audioData);
	else analyserNode.getByteFrequencyData(audioData);// waveform data
	// 2 - draw background
	ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha=0.8;
    ctx.fillRect(0,0,canvasWidth, canvasHeight);
    ctx.restore();
    
    ctx.save();
    if(params.duration != null)
    {
        ctx.fillStyle = "red";
        ctx.globalAlpha= 1;
        ctx.fillRect(10, 10, 500, 20);
        ctx.fillStyle = "green";
        ctx.fillRect(10, 10, (params.currentTime/params.duration) * 500, 20)
        ctx.fillText((Math.floor(params.currentTime/60))+":"+(params.currentTime%60) + "/"+ Math.floor(params.duration/60)+":"+(params.duration%60), 520, 20);
    }
    ctx.restore();
		
	// 3 - draw gradient
	if(params.showGradient){
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = .5;
        ctx.fillRect(0,0,canvasWidth,canvasHeight);
        ctx.restore();
    }
	// 4 - draw bars
	if(params.showBars){
        let negative = -1;
        let barSpacing = 4;
        let margin = 5;
        let screenWidthForBars = canvasWidth - (audioData.length*barSpacing) - margin*2;
        let barWidth = screenWidthForBars/audioData.length;
        let barHeight=200;
        let topSpacing=100;
        
        ctx.save();
        ctx.fillStyle='rgba(255,255,255,0.90)';
        ctx.strokeStyle='rgba(0,255,0, 0.90)';
        //loop through the data and draw!
        for(let i=1; i<audioData.length; i++){
            //ctx.fillRect(margin + i * (barWidth+barSpacing),topSpacing+256-audioData[i], barWidth, barHeight);
            //ctx.strokeRect(margin + i * (barWidth+barSpacing), topSpacing+256 - audioData[i], barWidth, barHeight);
            ctx.beginPath();
            ctx.moveTo(margin + (i-1)* (barWidth+barSpacing), (canvasHeight/2 - (audioData[i-1]*negative*-1)*0.5));
            ctx.lineTo(margin + (i)* (barWidth+barSpacing), (canvasHeight/2 -(audioData[i]*negative)*0.5));
            ctx.stroke();

            negative = negative*-1;
            
        }
        ctx.restore();
    }
    
    if(params.bouncingLines){
        let negative = -1;
        let barSpacing = 4;
        let margin = 5;
        let screenWidthForBars = canvasWidth - (audioData.length*barSpacing) - margin*2;
        let barWidth = screenWidthForBars/audioData.length;
        
        ctx.save();
        ctx.fillStyle='rgba(255,255,255,0.80)';
        ctx.strokeStyle='rgba(255,0,0, 0.80)';
        //loop through the data and draw!
        for(let i=1; i<audioData.length; i++){
            //ctx.fillRect(margin + i * (barWidth+barSpacing),topSpacing+256-audioData[i], barWidth, barHeight);
            //ctx.strokeRect(margin + i * (barWidth+barSpacing), topSpacing+256 - audioData[i], barWidth, barHeight);
            ctx.beginPath();
            ctx.moveTo(margin + (i-1)* (barWidth+barSpacing), canvasHeight/2 - (audioData[i-1]*negative));
            ctx.lineTo(margin + (i)* (barWidth+barSpacing), canvasHeight/2 -(audioData[i]*negative));
            ctx.stroke();
            negative = negative*-1;
        
        }
        ctx.restore();
    }
    
    if(params.quadraticCurves)
    {
        let negative = -1;
        let barSpacing = 4;
        let margin = 5;
        let screenWidthForBars = canvasWidth - (audioData.length*barSpacing) - margin*2;
        let barWidth = screenWidthForBars/audioData.length;
        let barHeight=200;
        
        ctx.save();
        ctx.fillStyle='rgba(255,255,255,0.80)';
        for(let i=1; i<audioData.length; i++){
            ctx.strokeStyle=`rgba(${255-i},${0+i}, ${0+ 2*i}, 0.80)`;
            
            ctx.beginPath();
            ctx.moveTo(canvasWidth/2, 0);
            ctx.quadraticCurveTo(canvasWidth/2 - ((audioData[i-1]*negative)*5), canvasHeight/2 , canvasWidth/2, canvasHeight);
            ctx.stroke();
            
            negative = negative*-1;
            
        }
        ctx.restore();
    }
	// 5 - draw circles
    if(params.showCircles){
        let maxRadius =canvasHeight/4;
        ctx.save();
        ctx.globalAlpha = 0.5;
        for(let i=0; i<audioData.length; i++){
            //red-ish circles
            let percent= audioData[i]/255;
            
            let circleRadius = percent*maxRadius;
            
            //blue-ish circles, bigger, more transparent
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(0,0,255,.15-percent/10.0);
            ctx.arc(canvasWidth, canvasHeight/2, circleRadius,0,2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(255,111,111, .05-percent/3.0);
            ctx.arc(canvasWidth, canvasHeight/2, circleRadius * 1.5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
            
            //yellow-ish circles, smaller
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(200,200,0,.10-percent/5.0);
            ctx.arc(canvasWidth, canvasHeight/2, circleRadius*.50, 0, 2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
            
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(255,111,111, .34-percent/3.0);
            ctx.arc(canvasWidth/2, canvasHeight/2, circleRadius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
            
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(0,0,255,.10-percent/10.0);
            ctx.arc(canvasWidth/2, canvasHeight/2, circleRadius*1.5,0,2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(200,200,0,.05-percent/5.0);
            ctx.arc(canvasWidth/2, canvasHeight/2, circleRadius*.50, 0, 2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
            
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(255,111,111, .10-percent/3.0);
            ctx.arc(0, canvasHeight/2, circleRadius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
            
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(0,0,255,.05-percent/10.0);
            ctx.arc(0, canvasHeight/2, circleRadius*1.5,0,2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle=utils.makeColor(200,200,0,.34-percent/5.0);
            ctx.arc(0, canvasHeight/2, circleRadius*.50, 0, 2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
        ctx.restore();
    }
    
    // 6 - bitmap manipulation
	// TODO: right now. we are looping though every pixel of the canvas (320,000 of them!), 
	// regardless of whether or not we are applying a pixel effect
	// At some point, refactor this code so that we are looping though the image data only if
	// it is necessary

	// A) grab all of the pixels on the canvas and put them in the `data` array
	// `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
	// the variable `data` below is a reference to that array 
	let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width;
	// B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
    for(let i=0; i< length; i+=4){
		// C) randomly change every 20th pixel to red
	    if(params.showNoise && Math.random() < 0.05){
			data[i] = data[i+1] = data[i+2] =0;
			data[i+1]=255;
		} // end if
        
        if(params.showInvert){
            let red = data[i], green = data[i+1], blue = data[i+2];
            data[i]=255-red;
            data[i+1]=255-green;
            data[i+2]=255-blue;
        }
		// magenta tint
		if(params.showTint){
            if(params.tintStyle=="Magenta")
            {
                data[i] += 50;  		// set red value
                //data[i+1] += 50; 		// set green value
                data[i+2] += 50;		// set blue value
                //data[i+3] -= 128;		// set alpha value
            }
            else if(params.tintStyle == "Red")
            {
                data[i] += 50;  		// set red value
            }
            else if(params.tintStyle == "Green")
            {
                data[i+1] += 50;  		// set green value
            }
            else if(params.tintStyle == "Blue")
            {
                data[i+2] += 50;  		// set blue value
            }
		}
		
	} // end for
    if(params.showEmboss){
         for(let i=0; i<length; i++){
             if (i%4 == 3) continue;
             data[i] = 127 + 2*data[i] - data[i+4] - data[i+width*4];
         }
     }
	// D) copy image data back to canvas
    ctx.putImageData(imageData, 0, 0);
}

export {setupCanvas,draw};