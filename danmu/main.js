let data = [
    {
        value:'2333',
        speed:2,
        time:0,
        color:'red',
        fontSize:'40'
    },{
        value:'666',
        speed:2,
        time:0,
        color:'red',
        fontSize:'40'
    },{
        value:'hhhhhhh',
        speed:2,
        time:0,
        color:'red',
        fontSize:'30'
    }
];
let $ = document.querySelector.bind(document);
let $canvas = $('#canvas');
let $video = $('#video');
class CanvasBarrage{
    constructor(canvas,video,options){
        if(!canvas || !video) return;
        this.canvas = canvas;
        this.video = video;
        this.context = canvas.getContext('2d');
        this.canvas.width = video.clientWidth;
        this.canvas.height = video.clientHeight;
        let defaultOptions = {
            fontSize:20,
            color:'red',
            speed:2,
            opacity:0.4,
            data:[]
        }
        Object.assign(this,defaultOptions,options);//对象合并，把属性直接挂载在实例上
        this.isPaused = true; //默认暂停播放
        this.barrages = this.data.map( obj =>new Barrage(obj,this));      
        this.render();
    }
    render(){
        this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.renderBarrage();
        if(this.isPaused === false){
            requestAnimationFrame(this.render.bind(this));//递归渲染
        }
    }
    renderBarrage(){
        let currentTime = this.video.currentTime;
        //将数组中的弹幕一一取出，判断时间和视频的时间是否符合，符合就渲染此弹幕
        this.barrages.forEach( barrage =>{
            if(!barrage.flag && currentTime >= barrage.time){
                //初始化后再进行绘制
                if(!barrage.isInited){
                    barrage.init();
                    barrage.isInited = true;
                }
                barrage.x -= barrage.speed;
                barrage.render();//渲染自己
                if(barrage.x <= barrage.wdith * -1){
                    barrage.flag = true;
                }
            }
        });
    }
    add(obj){
        this.barrages.push(new Barrage(obj,this));
    }
    reset(){
        this.context.clearRect(0,0,this.canvas.wdith,this.canvas.height)
        let time = this.video.currentTime;
        this.barrages.forEach( barrage =>{
            barrage.flag = false;
            if(time<= barrage.time){
                barrage.isInited = false; //重新初始化
            }else{
                barrage.flag = true; //其他弹幕不在渲染
            }
        });
    }
}

class Barrage{
    constructor(obj,ctx){
        this.obj = obj;
        this.value = obj.value;
        this.time = obj.time;
        this.ctx = ctx;
    }
    init(){
        this.opacity = this.obj.opacity || this.ctx.opacity;
        this.color = this.obj.color || this.ctx.color;
        this.fontSize = this.obj.fontSize || this.ctx.fontSize;
        this.speed = this.obj.speed || this.ctx.speed;
        //计算自身宽度 校验当前是否需要继续绘制
       let span = document.createElement('span');
       span.innerText = this.value;
       span.style.fontSize = this.fontSize + 'px';
       span.style.position = 'absolute';
       document.body.appendChild(span);
       this.width = span.clientWidth;
       document.body.removeChild(span);
       //弹幕的位置
       this.x = this.ctx.canvas.width;
       this.y = this.ctx.canvas.height * Math.random();
       //处理边界
       if(this.y < this.fontSize){
           this.y = this.fontSize;
       }
       if(this.y > this.ctx.canvas.clientHeight - this.fontSize){
           this.y = this.ctx.canvas.clientHeight - this.fontSize;
       }
    }
    render(){
        this.ctx.context.font =  this.fontSize + 'px Microsoft YaHei';
        this.ctx.context.fillStyle =  this.color;
        this.ctx.context.fillText(this.value,this.x,this.y);

    }
}


let barrage;

let socket = new WebSocket('ws://localhost:3000');
socket.onopen =function(){
    socket.onmessage = function(e){
        let message = JSON.parse(e.data);
        if(message.type === 'INIT'){
            barrage = new CanvasBarrage($canvas,$video,{
                data:message.data
            });
        }else if(message.type === 'ADD'){
            barrage.add(message.data);
        }
    };
};
$video.addEventListener('play',function(){
    barrage.isPaused = false;
    barrage.render();
})
$video.addEventListener('pause',function(){
    barrage.isPaused = true;
});

$('#send').addEventListener('click',function(){
    let value = $('#text').value;
    let time = video.currentTime;
    let color = $('#color').value;
    let fontSize = $('#range').value;
    let obj = {
        time,value,color,fontSize
    }
    socket.send(JSON.stringify(obj));
    // barrage.add(obj);
})
//拖动进度条重新初始化
$video.addEventListener('seeked',function(){
    barrage.reset();
});
