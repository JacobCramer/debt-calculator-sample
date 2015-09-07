
#Freelancing Sample - Debt Repayment Calculator

###What are we looking at here?
This is a sample of work by Jacob Daniel Cramer, also known by the usernames DracoAdvigilat and DracoAdvi. It's intended to show my skills with the **JavaScript** language when developing for a browser environment. While it's designed to have a nice CSS styled front-end, the focus is on the back-end engine.

There are a handful of design philosophies that were taken into account when designing the engine. First and foremost was separation of concerns through a **Model-View-Presenter** type design. Model-View-Presenter (MVP), is a slightly different take Model-View-Controller (MVC) design that aims for even greater separation between the front-end and back-end, allowing for **easier testing** and **better modularity**.

Speaking of modularity, another high-importance philosophy when designing this app was **ease of integration** with existing websites. Care was taken to avoid conflicts with other scripts by keeping as much information out of the global namespace as possible, and the resulting HTML output was designed to provide **flexibility for designers** by using simple, familiar, **easily skinned** elements.

###How much of it is raw JavaScript? How much is using APIs (e.g. jQuery)?
My philosophy when programming is to favor faster raw code when it's reasonable to do so, but don't go reinventing the wheel simply because you can. That said, the engine is **mostly pure JavaScript** with **some jQuery** sprinkled here and there.

As for other APIs: **require.js** was used to ensure files load in the correct order. **Grunt** (and by proxy **node.js**) was used for combining and minifying js files for deployment into a production environment. Ben Alpert's jQuery "splendid textchange" plugin was used to fix issues with older versions of Internet Explorer's lack of oninput support. All APIs used are released under the MIT license.

###Can I used this code?
Go for it. I'm releasing this code freely under the **MIT license**. If you're not familiar with the license, it's a short, simple, highly permissive license that lets you do nearly anything you want. Check out the included LICENSE file to read it, or [click here](https://tldrlegal.com/license/mit-license) for a quick summary.

###I'm a developer; what should I know to get started with this project?
You'll want to make sure you have node.js and Grunt installed on your system. The LiveReload plugin for Chrome is also a good idea. Grunt is used for running tasks any time you change a file; a good starting point to learn how it works [can be found here](http://24ways.org/2013/grunt-is-not-weird-and-hard/).
