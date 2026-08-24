const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();
setGlobalOptions({ region: 'europe-west2', maxInstances: 5 });

const auth = getAuth();
const db = getFirestore();

exports.setMemberAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in as an administrator.');
  }

  const targetUid = typeof request.data?.targetUid === 'string' ? request.data.targetUid : '';
  const action = request.data?.action;
  if (!targetUid || !['deactivate', 'reactivate'].includes(action)) {
    throw new HttpsError('invalid-argument', 'A member and access action are required.');
  }
  if (targetUid === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'You cannot change your own administrator access here.');
  }

  const callerSnapshot = await db.doc(`users/${request.auth.uid}`).get();
  if (!callerSnapshot.exists || callerSnapshot.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only administrators can change member access.');
  }

  const targetRef = db.doc(`users/${targetUid}`);
  const targetSnapshot = await targetRef.get();
  if (!targetSnapshot.exists) throw new HttpsError('not-found', 'That member no longer exists.');
  const target = targetSnapshot.data();
  if (target.role === 'admin') {
    throw new HttpsError('failed-precondition', 'Administrator access must be changed separately.');
  }

  const now = Timestamp.now();
  const nextStatus = action === 'deactivate' ? 'inactive' : (target.previousStatus || 'approved');
  const profileUpdate = action === 'deactivate'
    ? { status: nextStatus, previousStatus: target.status || 'approved', accessChangedAt: now, accessChangedBy: request.auth.uid }
    : { status: nextStatus, previousStatus: null, accessChangedAt: now, accessChangedBy: request.auth.uid };

  await auth.updateUser(targetUid, { disabled: action === 'deactivate' });
  await targetRef.set(profileUpdate, { merge: true });
  await db.collection('auditLogs').add({
    action: action === 'deactivate' ? 'member_deactivated' : 'member_reactivated',
    targetUid,
    actorUid: request.auth.uid,
    createdAt: now,
  });

  return { targetUid, action, status: nextStatus };
});
