import urllib.request
import os

urls = {
    "1_landing_mobile_nav_fix.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NjE3YmI0YzZmYjIwMjNiZThlZTExMWM3NmQzEgsSBxCasd26rRMYAZIBJAoKcHJvamVjdF9pZBIWQhQxNzYyNjM4NzM5NjAyNjQ5NTIzMw&filename=&opi=89354086",
    "2_dashboard_mobile_fixed.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NjE4MTE5ODdlM2UwNGU3NGFhZWQ5MmJiNWM4EgsSBxCasd26rRMYAZIBJAoKcHJvamVjdF9pZBIWQhQxNzYyNjM4NzM5NjAyNjQ5NTIzMw&filename=&opi=89354086",
    "3_transcript_upload.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NjE4MTE1NDVkMmEwM2IxYmQ5NTVjMGRmMmZkEgsSBxCasd26rRMYAZIBJAoKcHJvamVjdF9pZBIWQhQxNzYyNjM4NzM5NjAyNjQ5NTIzMw&filename=&opi=89354086",
    "4_marks_entry_status.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NjE4MTEwNDA5MzMwNWYxMzI1YTAzMmE5NGYyEgsSBxCasd26rRMYAZIBJAoKcHJvamVjdF9pZBIWQhQxNzYyNjM4NzM5NjAyNjQ5NTIzMw&filename=&opi=89354086",
    "5_analysis_projection.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NjE4MTEzM2Y4OGUwNWYxMzI1YTAzMmE5NGYyEgsSBxCasd26rRMYAZIBJAoKcHJvamVjdF9pZBIWQhQxNzYyNjM4NzM5NjAyNjQ5NTIzMw&filename=&opi=89354086",
    "6_settings.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NjE4MTE3NmU2NjMwMjI3OTgxNGY2MDI1ODVkEgsSBxCasd26rRMYAZIBJAoKcHJvamVjdF9pZBIWQhQxNzYyNjM4NzM5NjAyNjQ5NTIzMw&filename=&opi=89354086"
}

out_dir = "d:/summer/stitch_screens"
os.makedirs(out_dir, exist_ok=True)

for name, url in urls.items():
    print(f"Downloading {name}...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            with open(os.path.join(out_dir, name), 'w', encoding='utf-8') as f:
                f.write(html)
        print(f"Successfully downloaded {name}")
    except Exception as e:
        print(f"Failed to download {name}: {e}")
