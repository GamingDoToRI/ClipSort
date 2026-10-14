import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VideoBookmark, VideoLinkStatus } from '../types';

const VIDEOS_COLLECTION = 'videos';

/**
 * Save a newly added video bookmark to Firestore (partitioned by userId)
 */
export async function saveVideoToFirestore(video: VideoBookmark, userId?: string): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, video.id);
    const finalUserId = video.userId || userId || null;
    await setDoc(docRef, {
      ...video,
      userId: finalUserId,
      status: video.status || 'active',
      inTrash: video.inTrash || false,
      trashedAt: video.trashedAt || null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving video to Firestore:', error);
    throw error;
  }
}

/**
 * Update video category or status in Firestore
 */
export async function updateVideoInFirestore(
  videoId: string,
  updates: Partial<VideoBookmark>
): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating video in Firestore:', error);
    throw error;
  }
}

/**
 * Mark video as in trash in Firestore
 */
export async function moveVideoToTrashInFirestore(
  videoId: string,
  trashedAt: number = Date.now()
): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await updateDoc(docRef, {
      inTrash: true,
      trashedAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error trashing video in Firestore:', error);
    throw error;
  }
}

/**
 * Restore video from trash in Firestore
 */
export async function restoreVideoFromTrashInFirestore(videoId: string): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await updateDoc(docRef, {
      inTrash: false,
      trashedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring video in Firestore:', error);
    throw error;
  }
}

/**
 * Mark video status as trash_purged (영구 삭제 상태) or physically delete
 */
export async function deleteVideoFromFirestore(
  videoId: string,
  physical: boolean = true
): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    if (physical) {
      await deleteDoc(docRef);
    } else {
      await updateDoc(docRef, {
        status: 'trash_purged' as VideoLinkStatus,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error deleting video in Firestore:', error);
    throw error;
  }
}

/**
 * Update video link status (e.g., active, source_deleted, trash_purged)
 */
export async function setVideoStatusInFirestore(
  videoId: string,
  status: VideoLinkStatus
): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting video status in Firestore:', error);
    throw error;
  }
}

/**
 * Listen to real-time videos collection from Firestore partitioned by userId
 */
export function subscribeToVideos(
  userId: string,
  onData: (videos: VideoBookmark[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, VIDEOS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const videos: VideoBookmark[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        videos.push({
          id: docSnap.id,
          title: data.title || '',
          thumbnail: data.thumbnail || '',
          category: data.category || '미분류',
          url: data.url || '',
          createdAt: data.createdAt || Date.now(),
          source: data.source || 'web',
          status: (data.status as VideoLinkStatus) || 'active',
          inTrash: !!data.inTrash,
          trashedAt: data.trashedAt || undefined,
          userId: data.userId || userId,
        });
      });
      // Sort client-side by createdAt descending to avoid composite index requirement
      videos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onData(videos);
    },
    (err) => {
      console.error('Firestore videos subscription error:', err);
      if (onError) onError(err);
    }
  );
}
