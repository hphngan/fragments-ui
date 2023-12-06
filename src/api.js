// src/api.js

// fragments microservice API, defaults to localhost:8080
const apiUrl = process.env.API_URL;

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user, expand = 0) {
  console.log('Requesting user fragments data...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=${expand}`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

/**
 * Gets an authenticated user's fragment data with the given id
 */
export async function getFragmentById(user, id, ext = '') {
  console.log('Requesting user fragments data by id ' + id);

  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}.${ext}`, {
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    //const data = await res.text()
    const contentType = res.headers.get('content-type');
    //console.log('API Response Data:', await res.text());
    if (contentType.includes('text/')) {
      const data = await res.text();
      console.log(`Got user fragments ${contentType} data with given id: ${data}`);
      return { id: id, ContentType: contentType, data: data };
    }
    else if (contentType.includes('image/')) {
      try {
        const data = await res.blob();
        console.log(`Got user fragments image data with given id: ${data}`);
        return { id: id, ContentType: contentType, data: data };
      } catch (err) {
        console.log(`Unable to call GET /v1/fragments/:id \n ${err}`);
      }
    } else if (contentType.includes('application/json')) {
      try {
        const data = await res.text();
        console.log(`Got user fragments application/json data with given id: ${data}`);
        return { id: id, ContentType: contentType, data: data };
      } catch (err) {
        console.log(`Unable to call GET /v1/fragments/:id \n ${err}`);
      }
    }
    //return data ;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment/:id', { err });
  }
}

/**
 * Gets an authenticated user's fragment info with the given id
 */
export async function getFragmentByIdInfo(user, id) {
  console.log('Requesting user fragments data by id ' + id);

  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}/info`, {
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.text();

    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragments/:id/info', { err });
    throw new Error(err);
  }
}

/**
 * Creates a new fragment for the current authenticated user
 */
export async function postFragment(user, value, contentType) {
  console.log('Requesting to post user fragments data...');  
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'post',
      headers: user.authorizationHeaders(contentType),
      body: value,
    });
    if (!res.ok) {
      throw new Error(`{res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Post user fragments data', { data });
  } catch (err) {
    console.error('Unable to call POST /v1/fragment', { err });
  }
}

/**
 * Delete a fragment for the current authenticated user
 */
export async function deleteFragment(user, id) {
  console.log('Requesting to delete user fragments data...');  
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'delete',
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`{res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('delete user fragments data', { data });
  } catch (err) {
    console.error('Unable to call DELETE /v1/fragment', { err });
  }
}

/**
 * Update a fragment for the current authenticated user
 */
export async function updateFragment(user, id,  value, contentType) {
  console.log('Requesting to update user fragments data...');  
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'put',
      headers: user.authorizationHeaders(contentType),
      body: value,
    });
    if (!res.ok) {
      throw new Error(`{res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('update user fragments data', { data });
  } catch (err) {
    console.error('Unable to call PUT /v1/fragment', { err });
  }
}