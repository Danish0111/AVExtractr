#!/usr/bin/env python3
import sys
import json
import tempfile
import os
import subprocess

print("Script started", file=sys.stderr, flush=True)

def sanitize_filename(filename):
    """Remove invalid characters from filename"""
    import re
    sanitized = re.sub(r'[<>:"/\\|?*\r\n]', '', filename)
    if len(sanitized) > 200:
        sanitized = sanitized[:200]
    return sanitized.strip() or "media"

def get_ffmpeg_path():
    """Find ffmpeg executable"""
    if os.name == 'nt':  # Windows
        return "C:\\ffmpeg\\bin\\ffmpeg.exe"
    else:  # Linux
        return "/usr/bin/ffmpeg"

def extract_audio(url):
    """Extract audio as MP3"""
    try:
        from yt_dlp import YoutubeDL
        
        temp_dir = tempfile.gettempdir()
        ffmpeg_path = get_ffmpeg_path()
        pid = os.getpid()
        output_template = os.path.join(temp_dir, f"raw_audio_{pid}")
        final_audio = os.path.join(temp_dir, f"audio_{pid}.mp3")
        
        print(f"Downloading to: {output_template}", file=sys.stderr, flush=True)
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'quiet': False,
            'postprocessors': [],  # Don't use postprocessors
        }
        
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = sanitize_filename(info.get('title', 'audio'))
            video_id = info.get('id')
        
        # Find file - yt-dlp adds extension based on format
        downloaded_file = None
        print(f"Looking for files with video_id: {video_id}", file=sys.stderr, flush=True)
        
        # Check common extensions
        for ext in ['', '.m4a', '.webm', '.opus', '.mkv', '.mp4']:
            test_path = f"{output_template}{ext}"
            if os.path.exists(test_path):
                downloaded_file = test_path
                print(f"Found: {downloaded_file}", file=sys.stderr, flush=True)
                break
        
        # If still not found, list directory
        if not downloaded_file:
            print(f"File not found, listing {temp_dir}:", file=sys.stderr, flush=True)
            for f in os.listdir(temp_dir):
                if video_id in f or 'raw_audio' in f:
                    print(f"  {f}", file=sys.stderr, flush=True)
                    if f.startswith('raw_audio'):
                        downloaded_file = os.path.join(temp_dir, f)
                        break
        
        if not downloaded_file:
            return {'success': False, 'error': 'File not found'}
        
        # Convert with ffmpeg
        cmd = [ffmpeg_path, '-i', downloaded_file, '-vn', '-acodec', 'libmp3lame', '-ab', '192k', '-f', 'mp3', final_audio]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if os.path.exists(downloaded_file):
            os.remove(downloaded_file)
        
        if result.returncode != 0:
            return {'success': False, 'error': 'FFmpeg failed'}
        
        if not os.path.exists(final_audio):
            return {'success': False, 'error': 'MP3 not created'}
        
        return {'success': True, 'file': final_audio, 'filename': f"{title}.mp3"}
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr, flush=True)
        return {'success': False, 'error': str(e)}

def extract_video(url):
    """Extract video as MP4"""
    try:
        from yt_dlp import YoutubeDL
        
        temp_dir = tempfile.gettempdir()
        ffmpeg_path = get_ffmpeg_path()
        pid = os.getpid()
        output_template = os.path.join(temp_dir, f"raw_video_{pid}")
        
        print(f"Downloading video to: {output_template}", file=sys.stderr, flush=True)
        
        ydl_opts = {
            'format': 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]',
            'merge_output_format': 'mp4',
            'outtmpl': output_template,
            'quiet': False,
            'ffmpeg_location': ffmpeg_path,
        }
        
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = sanitize_filename(info.get('title', 'video'))
            video_id = info.get('id')
        
        # Find file
        video_file = None
        print(f"Looking for video file with id: {video_id}", file=sys.stderr, flush=True)
        
        for ext in ['', '.mp4', '.mkv', '.webm']:
            test_path = f"{output_template}{ext}"
            if os.path.exists(test_path):
                video_file = test_path
                print(f"Found video: {video_file}", file=sys.stderr, flush=True)
                break
        
        if not video_file:
            print(f"Video file not found", file=sys.stderr, flush=True)
            for f in os.listdir(temp_dir):
                if 'raw_video' in f:
                    print(f"  {f}", file=sys.stderr, flush=True)
                    video_file = os.path.join(temp_dir, f)
                    break
        
        if not video_file:
            return {'success': False, 'error': 'Video file not found'}
        
        return {'success': True, 'file': video_file, 'filename': f"{title}.mp4"}
        
    except Exception as e:
        print(f"Video error: {str(e)}", file=sys.stderr, flush=True)
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    try:
        print(f"Args: {sys.argv}", file=sys.stderr, flush=True)
        
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Invalid arguments'}))
            sys.exit(1)
        
        mode = sys.argv[1]
        url = sys.argv[2]
        
        if '/shorts/' in url:
            video_id = url.split('/shorts/')[1].split('?')[0]
            url = f'https://www.youtube.com/watch?v={video_id}'
        
        print(f"Mode: {mode}, URL: {url}", file=sys.stderr, flush=True)
        
        if mode == 'audio':
            result = extract_audio(url)
        elif mode == 'video':
            result = extract_video(url)
        else:
            result = {'success': False, 'error': 'Invalid mode'}
        
        print(json.dumps(result))
        sys.exit(0 if result.get('success') else 1)
        
    except Exception as e:
        print(f"Main error: {str(e)}", file=sys.stderr, flush=True)
        print(json.dumps({'success': False, 'error': str(e)}))