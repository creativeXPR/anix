import { getFunctions } from 'firebase/functions'
import { firebaseApp } from './firebase.js'

// Split from firebase.js so the Functions SDK loads only with screens that
// call Cloud Functions.
export const functions = getFunctions(firebaseApp)
// The moderated send callables live next to the `anix` database
// (europe-west1) — see functions/index.js SEND_REGIONS.
export const sendFunctions = getFunctions(firebaseApp, 'europe-west1')
