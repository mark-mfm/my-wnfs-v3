import { Component } from '@angular/core';

import * as wn from 'webnative';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-wnfs-v3';
  myText:string = '';
  savedText:any = '';
  wnStatus:string = '';
  username:string = '';

  program:any;
  session:any;
  fs:any;
  requesterPin:string = '';
  providerPin:string = '';


  ngOnInit() {
    this.initWebnative();  
  }

  async initWebnative() {
    
    this.wnStatus = 'checking...'

    this.program = await wn.program({
      namespace: {
        creator: "<ENTER_CREATOR_HERE>",
        name: "<ENTER_APP_NAME_HERE>"
      },
      debug: true,
      fileSystem: {
        loadImmediately: true
      }
    })
    .catch((err) => {
      console.log(err)
      this.wnStatus = 'error!';
      switch (err) {
        case wn.ProgramError.InsecureContext:
          // Webnative requires HTTPS
          break;
        case wn.ProgramError.UnsupportedBrowser:
          break;
      }
    })

    // Do we have an existing session?
    if(this.program && this.program.session) {
      console.log('existing session')

      this.session = this.program.session
      this.fs = this.session.fs;
      console.log(this.fs)

      this.wnStatus = 'connected';
      this.username = this.session.username;
    }
    else {
      this.wnStatus = 'not connected';
    } 
  }
  
  async connectToWebnative(method:string) {

    if(method == 'new') {
      // Check if username is valid and available on Fission service
      const valid = await this.program.auth.isUsernameValid(this.username)
      const available = await this.program.auth.isUsernameAvailable(this.username)
      
      if(valid && available) {
        //let's authenticate as a new user, registering a new Fission account
        const { success } = await this.program.auth.register({ 
          username: this.username
        })

        this.session = success ? await this.program.auth.session() : null
        
        //grab the filesystem if we have a session
        this.fs = this.session?.fs;
        console.log(this.fs)

        this.wnStatus = 'connected';
      }
      else {
        alert('username is invalid and/or unavailable')
      }
      
    }
    else if(method == 'link') {
      if(this.username != '') {
        this.requestAuthentication()
      }
      else {
        alert('please enter a username before attempting to link')
      }
      
    }
    

    console.log(this.session)
    console.log(this.fs)
  }


  async requestAuthentication() {
    const consumer = await this.program.auth.accountConsumer(this.username)
    
    // The consumer generates a PIN and sends it to the producer
    consumer.on("challenge", ({ pin }) => {
      // Display the PIN (each number in the pin is comma-separated so we remove those)
      this.requesterPin = pin.toString().replace(/,/g,'');
      alert(`Pin: ${this.requesterPin}`)
    })

    // The consumer receives an approval or rejection message from the producer
    consumer.on("link", async ({ approved, username }) => {
      if (approved) {
        console.log(`Successfully authenticated as ${username}`)
        this.session = await this.program.auth.session()
        //grab the filesystem if we have a session
        this.fs = this.session?.fs;
        console.log(this.fs)

        this.wnStatus = 'connected';
      }
      else {
        console.log('authentication failed')
      }
    })

  }


  async provideAuthentication() {
    // The producer should already have an active session
    const producer = await this.program.auth.accountProducer(this.program.session.username)

    // The producer receives a challenge PIN from the consumer
    producer.on("challenge", challenge => {
      //each number in the pin is comma-separated so we remove those
      this.providerPin = challenge.pin.toString().replace(/,/g,'');
      // Either show `challenge.pin` or have the user input a PIN and check if they're equal.
      if(confirm(`Pin is a match?\n\n${this.providerPin}`)) {
        challenge.confirmPin()
      }
      else {
        challenge.rejectPin()
      }
    })

    // The producer reports whether a user approved or rejected
    producer.on("link", ({ approved }) => {
      if (approved) console.log("authentication successful")
    })

  }

  
  async writeToFileSystem() {
    const { Branch } = wn.path

    // Set a sub directory and file path
    const filePath = wn.path.file(
    Branch.Private, "Notes", "testnote2.md"
    )

    //write content to the file
    await this.fs.write(filePath,
      new TextEncoder().encode(this.myText)
    )
    .then((result) => {
      console.log(result)
    })
    .catch((err) => {
      console.log(err)
    })

    // Persist changes and announce them to your other devices
    await this.fs.publish()
    .then((result) => {
      console.log(result)
    })
    .catch((err) => {
      console.log(err)
    })

  }


  async readFromFileSystem() {
    
    const { Branch } = wn.path

    const filePath = wn.path.file(
      Branch.Private, "Notes", "testnote2.md"
      )

    this.savedText = new TextDecoder().decode(await this.fs.read(filePath));
  }


  async syncFileSystem() {
    
    this.fs = await this.program.loadFileSystem(this.username)
    console.log(this.fs)  
  
  }


  async destroyWNSession() {
    await this.session.destroy()
    .then(() => {
    this.wnStatus = 'disconnected';
    this.username = '';
    })
    .catch((err) => {
    console.log(err)
    });
  }

}
