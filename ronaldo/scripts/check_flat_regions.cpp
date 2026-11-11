// Native-resolution connected color-region audit. No third-party image libraries.
// Input is RGB24 frames from ffmpeg, output is JSONL. Quantization is fixed at
// 16/256 per RGB channel to tolerate H.264 noise without treating gradients as flat.
#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <iostream>
#include <vector>
int main(int argc, char** argv) {
  if(argc!=4) return 2;
  const int w=std::atoi(argv[1]),h=std::atoi(argv[2]);
  const double fps=std::atof(argv[3]);
  const int top=static_cast<int>((h-w/2.39)/2.0+0.999999);
  const int bottom=h-top, rows=bottom-top, n=w*rows;
  std::vector<unsigned char> rgb(w*h*3),seen(n);
  std::vector<uint16_t> colors(n);
  std::vector<int> queue(n), histogram(4096);
  int frame=0;
  while(std::fread(rgb.data(),1,rgb.size(),stdin)==rgb.size()) {
    std::fill(seen.begin(),seen.end(),0);
    std::fill(histogram.begin(),histogram.end(),0);
    for(int i=0;i<n;i++) {const int p=(i+top*w)*3;
      colors[i]=((rgb[p]>>4)<<8)|((rgb[p+1]>>4)<<4)|(rgb[p+2]>>4);
      histogram[colors[i]]++;
    }
    // Only globally large buckets can form a >30% connected region. Flood all
    // buckets >=10% so the report also measures typical large background areas.
    int largest=0,color=0;
    for(int i=0;i<n;i++) {
      if(seen[i]||histogram[colors[i]]<n*.10) continue;
      const uint16_t c=colors[i]; int begin=0,end=1; queue[0]=i; seen[i]=1;
      while(begin<end) {const int p=queue[begin++],x=p%w;
        auto push=[&](int q) {if(!seen[q]&&colors[q]==c) {seen[q]=1;queue[end++]=q;}};
        if(x>0)push(p-1); if(x+1<w)push(p+1); if(p>=w)push(p-w); if(p+w<n)push(p+w);
      }
      if(end>largest){largest=end;color=c;}
    }
    const double fraction=static_cast<double>(largest)/n;
    std::cout << "{\"frame\":"<<frame<<",\"seconds\":"<<frame/fps
      <<",\"regionFraction\":"<<fraction<<",\"rgbBin\":["<<((color>>8)&15)*16
      <<","<<((color>>4)&15)*16<<","<<(color&15)*16<<"],\"passed\":"
      <<(fraction<=.30?"true":"false")<<"}\n";
    frame++;
  }
  return frame>0?0:3;
}
