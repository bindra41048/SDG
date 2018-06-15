# SDG
Created by:
* Varun Bindra
* Tassica Lim
* Alex Wade
* Ada Zhou

**This is a readme**

## LINKS ##
* [Wireframe prototypes Google Doc](https://docs.google.com/presentation/d/19BCDviMSk3s_VIdAQ38V3_ZXrIg4IAug3f2fSjoTf8o/edit?usp=sharing)
* [Leaflet tutorial](http://spatialcarpentry.github.io/cartography/show%20your%20results/leaflet/)
* [another Leaflet tutorial](https://maptimeboston.github.io/leaflet-intro/)
* [GeoJSON data](http://eric.clst.org/tech/usgeojson/)
* [Node.js debugger](https://nodejs.org/api/debugger.html)
* [Express/Node.js tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website)

## HOW TO START ##
* Download Node.js and npm if you have not done so before. See here for a Node/npm download tutorial: http://web.stanford.edu/class/cs193x/install-node/
* Install git (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) if you have not done so already. 
* Clone this repository to a convenient place on your local filesystem (https://help.github.com/articles/cloning-a-repository/#platform-mac)
* From the root of the repository, run "git branch -b [your-branch-name]" to create a new working branch.
* Navigate to the sdg-site working directory and from within this directory create a file named ".env". In this ".env" file, copy and paste the text in the .env Google Doc (which is shared with all project collaborators) into your newly created ".env" file
* From the sdg-site working directory, run `DEBUG=sdg-site:* npm run devstart`on Mac or `SET DEBUG=express-locallibrary-tutorial:* & npm start` on Windows
* In a browser, visit `http://localhost:3000/` to run the local version of your site
* When you are satisfied with changes on your local development branch, use git add on all your modified files and git commit with a commit message. Then run `git push -u origin [your-branch-name]` from within the project directory to push the local branch you've been working on to remote
* If you would like to merge the changes to the master branch, navigate to the Github browser and submit a pull request for the branch you've just pushed to remote (https://help.github.com/articles/creating-a-pull-request/). Have a team member review the pull request and approve it to merge it in to master
* Once the changes are merged in master, it is time to deploy the changes on Heroku. First, run `git branch master` and then `git pull` from within the repository
* If you haven't already, install the Heroku CLI (https://devcenter.heroku.com/articles/heroku-cli)
* Run `heroku login` from the command line at the root of the repository
* Run `heroku git:remote -a sdg-site` from the command line at the root of the repository (Note: this requires you to be added as a collaborator on our Heroku deployment, which we will do for all project collaborators)
* Run `git add .` from the command line at the root of the repository
* Run `git push heroku master` to have the most updated version of your Github master branch be deployed to Heroku, which serves web requests on the (http://sdg-site.herokuapp.com) url.
