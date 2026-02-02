import os
import isodate
from googleapiclient.discovery import build
from supabase import create_client

# 1. Load Secrets (from Environment Variables)
YT_API_KEY = os.getenv("YOUTUBE_API_KEY")
SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_KEY")
PLAYLIST_ID = 'PLbTprN6DlvH6MZRzfo_W1_0MnIdvpwF0x'

def run_sync():
    # 2. Initialize Clients
    supabase = create_client(SUPA_URL, SUPA_KEY)
    youtube = build('youtube', 'v3', developerKey=YT_API_KEY)
    
    # 3. Fetch Video IDs from Playlist
    video_ids = []
    next_page_token = None
    while True:
        res = youtube.playlistItems().list(
            part='contentDetails', 
            playlistId=PLAYLIST_ID, 
            maxResults=50, 
            pageToken=next_page_token
        ).execute()
        
        video_ids.extend([item['contentDetails']['videoId'] for item in res.get('items', [])])
        next_page_token = res.get('nextPageToken')
        if not next_page_token: 
            break

    # 4. Fetch Statistics for all videos
    total_views, total_sec = 0, 0
    for i in range(0, len(video_ids), 50):
        res = youtube.videos().list(
            part='statistics,contentDetails', 
            id=','.join(video_ids[i:i+50])
        ).execute()
        
        for item in res.get('items', []):
            total_views += int(item.get('statistics', {}).get('viewCount', 0))
            dur = item.get('contentDetails', {}).get('duration')
            if dur: 
                total_sec += isodate.parse_duration(dur).total_seconds()

    # 5. Insert Record into Supabase
    # table must have columns: view_count (int8) and total_hours (int8)
    supabase.table("playlist_history").insert({
        "view_count": total_views, 
        "total_hours": int(total_sec // 3600)
    }).execute()
    
    print(f"✅ Sync complete: {total_views} views and {total_sec // 3600} hours logged.")

if __name__ == "__main__":
    run_sync()