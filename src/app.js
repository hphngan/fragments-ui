// src/app.js

import { Auth, getUser } from './auth';
import { getUserFragments, getFragmentById, postFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const fragmentSection = document.querySelector('#fragment');
  const fragmentList = document.querySelector('.fragment');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();

   // Do an authenticated request to the fragments API server and log the all metadata
   //getUserFragments(user);
   const expandedFragments2 = await getUserFragments(user, 1);
        console.log("user's existing fragments with all metadata: ", expandedFragments2);

    //display user's existing fragmnets
   const expandedFragments = await getUserFragments(user);
    console.log("user's existing fragments ", expandedFragments);
  if (expandedFragments && expandedFragments.fragments.length > 0) {
    const getfragmentData = expandedFragments.fragments.map(async (fragmentId, idx) => {
      return await getFragmentById(user, fragmentId).then((fragmentData) => {
        // Log fragment data for debugging purposes
        return `${idx + 1}:  fragment's data: ${fragmentData[1]}`;
      });
    });
    const fragmentDataList = await Promise.all(getfragmentData);
    fragmentList.innerText = fragmentDataList.join('\n');
  } else {
    fragmentList.innerText = 'No fragments found.';
  }
  

  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  document.getElementById('fragmentType').addEventListener('change', (e) => {
    e.preventDefault();

    selectedType = e.target.value;
    console.log(`seleted type: ${selectedType}`);
  });

  let selectedType = 'text/plain';

  let fragmentForm = document.getElementById('fragmentForm');
  fragmentForm.addEventListener('submit', postFunction);

  async function postFunction(e) {
    e.preventDefault();
  try{
    console.log(
      `User input manually: ${document.getElementById('textFragment').value}`
    );

    const textFragment = document.getElementById('textFragment').value;
      console.log(selectedType);
    // Create a new fragment for the user
    await postFragment(user, textFragment, selectedType);

    // Gets user's fragments
    const fragment = await getUserFragments(user);

    // Log fragment data for debugging purposes
    console.log('fragment data: ', {fragment});

    // Gets fragments' data
    if (fragment) {
      const getfragmentData = fragment.fragments.map(async (fragmentId, idx) => {
        return await getFragmentById(user, fragmentId).then((fragmentData) => {
          // Log fragment data for debugging purposes
          return `${idx + 1}: fragment's data: ${
            fragmentData[1]
          }`;
        });
      });

      const fragmentData = await Promise.all(getfragmentData);

      console.log('all fragment data', fragmentData);

      // Display fragments
      document.querySelector('.fragment').innerText = fragmentData.join('\n');

      // Clear input box
      document.getElementById('textFragment').value = '';
    }
  } catch (error) {
    console.log(error);
    }
  }
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);