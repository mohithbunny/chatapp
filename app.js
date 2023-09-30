// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, set,get,child,onValue,onChildAdded } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

let box=document.getElementById("box");
let message=document.getElementById("message");
let submit=document.getElementById("submit");
let name;
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuiAywOitInNIb4-mihoWtaA8XoawoD5o",
  authDomain: "chatapp-ce13a.firebaseapp.com",
  databaseURL: "https://chatapp-ce13a-default-rtdb.firebaseio.com",
  projectId: "chatapp-ce13a",
  storageBucket: "chatapp-ce13a.appspot.com",
  messagingSenderId: "831089401994",
  appId: "1:831089401994:web:bddd5a8f1541f736800d73"
};

// Initialize Firebase

// Assume you have a Firebase database URL
const app = initializeApp(firebaseConfig);

const db = getDatabase();


function get1(name){
const dbRef = ref(getDatabase());
let k;
get(child(dbRef, `users/${name}`)).then((snapshot) => {
  if (snapshot.exists()) {
    console.log(snapshot.val());
   append(name,snapshot.val().message,)
  } else {
    console.log("none");
  
  }
}).catch((error) => {
  console.error(error);
});
return k;

}



function writeUserData(name,message) {
  const db = getDatabase();
  set(ref(db, 'users/' + name), {
    message:message
   // profile_picture : imageUrl
  });
}


//writeUserData(prompt("enter id"),prompt("enter name"));
function append(name,message,position){
   let ele=document.createElement("div");
   ele.innerHTML=`${name}:${message}`;
   if(position==="left")
   ele.classList.add("child1");
  else
  ele.classList.add("child2");
   box.appendChild(ele);
}





name=prompt("enter name");
writeUserData(name,"");

submit.addEventListener("click",()=>{
  console.log(message.value)
  writeUserData(name,message.value);
  onValue( ref(db, 'users/'), (snapshot) => {
    const data = snapshot.val();
    console.log(data.name);
   get1(name,"right");
  });
 


document.getElementById("divas").innerHTML="sai";
});
const starCountRef = ref(db, 'users/');
onValue(starCountRef, (snapshot) => {
  const data = snapshot.val();
 
  console.log(get1(name,"left"));
 
});

