// src/app.js

import { Auth, getUser } from './auth';
import { getUserFragments, getFragmentById, getFragmentByIdInfo, postFragment, updateFragment, deleteFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const deleteBtn = document.querySelector('#deleteBtn');
  const updateBtn = document.querySelector('#updateBtn');
  const createBtn = document.querySelector('#createBtn');
  const convertBtn = document.querySelector('#convertBtn');
  const displayBtn = document.querySelector('#displayBtn');
  const fragmentSection = document.querySelector('#fragmentCreate');
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
  const expandedFragments2 = await getUserFragments(user, 1);
      console.log("user's existing fragments with all metadata: ", expandedFragments2);

  //display user's existing fragmnets
  const expandedFragments = await getUserFragments(user);
  console.log("user's existing fragments ", expandedFragments);
  var select = document.getElementById('fragmentDropdown');
  if (expandedFragments && expandedFragments.fragments.length > 0) {
    await updateFragmentList();
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

  let fragmentForm = document.getElementById('fragmentForm');
  fragmentForm.addEventListener('submit', postFunction);
  let selectedType;
  var fileCreate;
  let fileCreateType;
  let fileUpdate;
  let fileTypeUpdate;

  
  document.getElementById('fragmentType').addEventListener('change', (e) => {
    e.preventDefault();

    selectedType = e.target.value;
    console.log(`seleted type: ${selectedType}`);
    // Image types that should disable the text input
    const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const textTypes = ['text/plain', 'text/html', 'text/markdown', 'application/json'];
  
    // Enable or disable the input based on the selected type
    document.getElementById('textFragment').disabled = imageTypes.includes(selectedType);
    document.getElementById('imageFragment').disabled = textTypes.includes(selectedType);

    document.getElementById('imageFragment').addEventListener('change', (e) => {
      let input = e.target;
      fileCreate = input.files[0];
      fileCreateType = fileCreate.type;
    });
  });
  
  async function postFunction(e) {
    e.preventDefault();
  try{
    const textFragment = document.getElementById('textFragment').value;

    if (!textFragment) {
      if (fileCreateType !== selectedType) {
        alert('The file extension does not match the selected type.');
      } else {
        let reader = new FileReader();
        reader.onload = async (e) => {
          try {
             await postFragment(user, e.target.result, selectedType);
            } catch (error) {
            console.error({ error }, 'Error posting file');
          }
        };
        reader.readAsArrayBuffer(fileCreate);
      }
    } else {
      await postFragment(user, textFragment, selectedType);
    }

    // Gets user's fragments
    const fragment = await getUserFragments(user);

    // Log fragment data for debugging purposes
    console.log('fragment data: ', {fragment});

    // Update fragments' list
    
      await updateFragmentList();

      // Clear input box
      document.getElementById('textFragment').value = '';
  } catch (error) {
    console.log(error);
    }
  }

  deleteBtn.addEventListener('click', handleDelete);
  async function handleDelete() {
    const selectedFragmentId = document.getElementById('fragmentDropdown').value;
    if (!selectedFragmentId) {
      alert('Please select a fragment to delete.');
      return;
    }
  
    try {
      await deleteFragment(user, selectedFragmentId);
      console.log(`Fragment with ID ${selectedFragmentId} deleted`);
  
      // Update dropdown list after deletion
      await updateFragmentList();
    } catch (err) {
      console.error('Error deleting fragment:', err);
      alert('Error deleting fragment');
    }
  }

  async function updateFragmentList() {
    const select = document.getElementById('fragmentDropdown');
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  
    const updatedFragments = await getUserFragments(user);
    if (updatedFragments) {
      updatedFragments.fragments.forEach(async (fragmentId, idx) => {
        const fragmentData = await getFragmentById(user, fragmentId);
        console.log(`fragmentData: ${fragmentData.data}`);
        var option = document.createElement('option');
        option.text = `${fragmentData.id}: ${fragmentData.ContentType}: ${fragmentData.data}`;
        option.value = fragmentData.id;
        select.appendChild(option);
      });
    }
  }

  updateBtn.addEventListener('click', handleUpdate);

  async function handleUpdate() {
    const selectedFragmentId = document.getElementById('fragmentDropdown').value;
    if (!selectedFragmentId) {
      alert('Please select a fragment to update.');
      return;
    }

    try {
      const fragmentData = await getFragmentById(user, selectedFragmentId);
      if (fragmentData) {
        console.log('Selected Fragment Data for Update:', fragmentData);

        // Toggle visibility of sections
        fragmentSection.style.display = 'none'; 
        document.getElementById('fragmentConvert').style.display = 'none';
        document.getElementById('fragmentInfoDisplay').style.display = 'none';
        document.getElementById('fragmentUpdate').style.display = 'block'; 

        // Populate the update form with fragment data
        populateUpdateForm(fragmentData);
      }
    } catch (err) {
      console.error('Error fetching fragment for update:', err);
      alert('Error fetching fragment data');
    }
  }


  function populateUpdateForm(fragmentData) {
    const type = document.getElementById('fragmentTypeUpdate');
    const textInput = document.getElementById('textFragmentUpdate');
    textInput.innerHTML = '';
    const fileInput = document.getElementById('imageFragmentUpdate');
    let id = fragmentData.id;
    type.value = fragmentData.ContentType;
    type.disabled = true;

    if (fragmentData.ContentType.startsWith('text/') || fragmentData.ContentType.startsWith('application/json')) {
      textInput.value = fragmentData.data;
      textInput.disabled = false;
      fileInput.disabled = true;
    } else if (fragmentData.ContentType.startsWith('image/')) {
      textInput.disabled = true;
      fileInput.disabled = false;
    }

    let fragmentFormUpdate = document.getElementById('fragmentFormUpdate');
    fragmentFormUpdate.addEventListener('submit', postUpdate);

    document.getElementById('imageFragmentUpdate').addEventListener('change', (e) => {
      let input = e.target;
      fileUpdate = input.files[0];
      fileTypeUpdate = fileUpdate.type;
      console.log(`Image input manually: ${fileTypeUpdate}`);
      if (!fileTypeUpdate) {
        document.getElementById('submitUpdateBtn').disabled = true;
      }
    });

    document.getElementById('textFragmentUpdate').addEventListener('change', (e) => {
      if (!e.target.value) {
        document.getElementById('submitUpdateBtn').disabled = true;
      }
    });


    async function postUpdate(e) {
      e.preventDefault();
    try{
        const textFragmentUpdate = document.getElementById('textFragmentUpdate').value;
        const imageFragment = document.getElementById('imageFragment');
        if (!textFragmentUpdate) {
          if (fileTypeUpdate !== fragmentData.ContentType) {
            alert('The file extension does not match the selected type.');
          } else {
            let reader = new FileReader();
            reader.onload = async (e) => {
              try {
                  await updateFragment(user, id, e.target.result, fragmentData.ContentType);
                } catch (error) {
                console.error({ error }, 'Error posting file');
              }
            };
            reader.readAsArrayBuffer(fileUpdate);
          }
        } else {
          await updateFragment(user, id, textFragmentUpdate, fragmentData.ContentType);
        }
        console.log(selectedType);
      
      // Gets user's fragments
      const fragment = await getUserFragments(user);

      // Log fragment data for debugging purposes
      console.log('fragment data: ', {fragment});

      // Gets fragments' data
      
        await updateFragmentList();

        // Clear input box
        document.getElementById('textFragment').value = '';
      
    } catch (error) {
      console.log(error);
      }
    }
  }

  

  createBtn.addEventListener('click', handleCreate);

  async function handleCreate() {
    document.getElementById('fragmentUpdate').style.display = 'none'; 
    document.getElementById('fragmentConvert').style.display = 'none';
    document.getElementById('fragmentInfoDisplay').style.display = 'none';
    document.getElementById('fragmentCreate').style.display = 'block'; 
  }

  displayBtn.addEventListener('click', handleDisplay);

  async function handleDisplay() {
    document.getElementById('fragmentUpdate').style.display = 'none'; 
    document.getElementById('fragmentConvert').style.display = 'none';
    document.getElementById('fragmentInfoDisplay').style.display = 'block';
    document.getElementById('fragmentCreate').style.display = 'none'; 

    const selectedFragmentId = document.getElementById('fragmentDropdown').value;

    const selectedFragment = await getFragmentByIdInfo(user, selectedFragmentId);
    console.log(`select ${selectedFragment}`);
    const displayElement = document.getElementById('fragmentInfoDisplay');
    displayElement.innerHTML='';

    const textElement = document.createElement('pre');
      textElement.textContent = selectedFragment;
      displayElement.appendChild(document.createElement("br"));
      displayElement.appendChild(textElement);

    
  }

  convertBtn.addEventListener('click', handleConvert);
  async function handleConvert() {
    document.getElementById('fragmentUpdate').style.display = 'none';
    document.getElementById('fragmentConvert').style.display = 'block';
    document.getElementById('fragmentInfoDisplay').style.display = 'none';
    document.getElementById('fragmentCreate').style.display = 'none'; 
   
  }

  let fragmentFormConvert = document.getElementById('fragmentFormConvert');
    fragmentFormConvert.addEventListener('submit', convertFragment);

    async function convertFragment(e) {
      e.preventDefault();
    
      const selectedFragmentId = document.getElementById('fragmentDropdown').value;
      const conversionType = document.getElementById('fragmentTypeConvert').value;
      console.log('Converted Type:', conversionType);
      if (!selectedFragmentId) {
        alert('Please select a fragment to convert.');
        return;
      }
      await displayConvertedFragment(selectedFragmentId, conversionType);
      
    }

  async function displayConvertedFragment(selectedFragmentId, conversionType) {
    const displayElement = document.getElementById('fragmentConvertDisplay');
    const imageElement = document.getElementById('fragmentConvertImage');
    let selectedFragment = null;
    let convertedFragment = null;

    try {
      // Fetch the selected fragment and convert
      //selectedFragment = await getFragmentByIdInfo(user,selectedFragmentId);
      convertedFragment = await getFragmentById(user, selectedFragmentId, conversionType);
      console.log('Converted Fragment:', convertedFragment);
      
    // Clear any previous content
    displayElement.innerHTML = '';
  
    // Display the converted fragment based on its content type
     if (convertedFragment.ContentType.startsWith('text/') || convertedFragment.ContentType.startsWith('application/json')) {
      const textElement = document.createElement('pre');
      textElement.textContent = convertedFragment.data;
      displayElement.appendChild(textElement);
      } else if (convertedFragment.ContentType.startsWith('image/')) {
        const blobData = convertedFragment.data;
          let imageElement = document.getElementById('fragmentConvertImage');
      
        if (!imageElement) {
        imageElement = document.createElement('img');
        imageElement.id = 'fragmentConvertImage';
        displayElement.appendChild(imageElement);
        }
      
        const url = window.URL.createObjectURL(blobData);
        imageElement.onload = () => {
          window.URL.revokeObjectURL(url); 
        };
        imageElement.onerror = () => {
          alert('Error loading image');
        };
        imageElement.src = url;
      }
    } catch (err) {
      console.error('Error converting fragment:', err);
      alert('Error converting fragment');
    }   
  }
  
  
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);