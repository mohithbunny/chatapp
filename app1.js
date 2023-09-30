
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

let box=document.getElementById("box");
let message=document.getElementById("message");
let submit=document.getElementById("submit");
let name,x;
// Your web app's Firebase configuration


// Initialize Firebase

window.addEventListener('storage', function(event) {
    console.log(event);
    
    if(event.newValue==="~")
    append(event.key,"has joined chat","middle");
else
    append(event.key,event.newValue,"left");

});

//writeUserData(prompt("enter id"),prompt("enter name"));
function append(name,message,position){
   let ele=document.createElement("div");
   ele.innerHTML=`${name}:${message}`;
   if(position==="left")
   ele.classList.add("child1");
  else if(position==="right")
  ele.classList.add("child2");
else
ele.classList.add("child3");


   
    box.appendChild(ele);
    
    box.scrollTop = box.scrollHeight;
}


let dupmessage;

let name1=prompt("enter name");

localStorage.setItem(name1,"~");

submit.addEventListener("click",()=>{
    x=message.value;

})
submit.addEventListener("click",()=>{
  

if(message.value==dupmessage||undefined==dupmessage){
    
dupmessage=message.value;

x+=".";
localStorage.setItem(name1,x);

}else{
    localStorage.setItem(name1,message.value);
}
    append(name1,message.value,"right");




document.getElementById("divas").innerHTML="sai";
});
