#!/usr/bin/env python3
"""Original deterministic stereo score and Foley. Requires NumPy/SciPy; no recordings."""
import json, pathlib, wave
import numpy as np
from scipy.signal import butter, sosfilt
ROOT=pathlib.Path(__file__).resolve().parents[1]
film=json.loads((ROOT/'films/bear-waterfall/film.json').read_text())
SR=48000; N=int(film['duration']*SR); t=np.arange(N)/SR
rng=np.random.default_rng(film['seed']); out=np.zeros((N,2),np.float64)
def filt(x,hz,kind='lowpass',order=2):return sosfilt(butter(order,hz,btype=kind,fs=SR,output='sos'),x)
def add(sig,start,vol=1,pan=0):
 i=round(start*SR)
 if i<0:sig=sig[-i:];i=0
 n=min(len(sig),N-i)
 if n<=0:return
 gains=[np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)]
 for ch in range(2):out[i:i+n,ch]+=sig[:n]*vol*gains[ch]
def noise(d):return rng.normal(0,1,int(SR*d))
def env(d,a=.008,decay=6):
 tt=np.arange(int(d*SR))/SR
 return (1-np.exp(-tt/a))*np.exp(-tt*decay)
# Waterfall: broad flowing hiss, low water body, stereo turbulence.
for ch in range(2):
 white=noise(10); low=filt(white,350); high=filt(white,450,'highpass'); high=filt(high,7500)
 modulation=.84+.08*np.sin(t*2.3+ch)+.05*np.sin(t*6.7+ch*2)
 proximity=np.interp(t,[0,3.1,3.11,6.3,6.31,8.1,10],[.65,.7,.50,.50,.75,1.0,.88])
 out[:,ch]+=(low*.24+high*.033)*modulation*proximity
# Little low water burbles, right side.
for at in np.arange(.12,10,.19):
 d=.13;tt=np.arange(int(d*SR))/SR; f=rng.uniform(180,550)
 add(np.sin(2*np.pi*(f*tt+550*tt*tt))*env(d,.006,28),at,.008,.65)
# Gentle original felt-marimba/celesta motif in D pentatonic.
notes=[(.20,293.665,1.3,.095),(.70,369.994,1.5,.08),(1.22,440,1.7,.08),(2.0,554.365,1.6,.075),(3.22,659.255,1.5,.065),(3.85,587.33,1.4,.055),(4.34,739.989,.65,.035),(5.10,440,1.7,.065),(5.57,554.365,1.6,.075),(6.24,587.33,1.6,.075),(7.05,739.989,1.7,.06),(7.63,880,1.8,.055),(8.55,587.33,1.8,.07),(8.56,739.989,1.6,.03),(8.57,880,1.4,.025)]
for at,f,d,v in notes:
 tt=np.arange(int(d*SR))/SR
 sig=(np.sin(2*np.pi*f*tt)*np.exp(-tt*2.8)+.23*np.sin(2*np.pi*f*2.003*tt)*np.exp(-tt*6)+.08*np.sin(2*np.pi*f*3.99*tt)*np.exp(-tt*10))*(1-np.exp(-tt*160))
 add(sig,at,v,-.25)
 for delay,g in [(.09,.13),(.17,.10),(.29,.065)]:add(sig,at+delay,v*g,.4)
# Warm bowed harmonic bed with slow attack and release.
for f in [146.832,220,293.665]:
 sig=np.sin(2*np.pi*f*t+.0015*np.sin(t*5))+.18*np.sin(2*np.pi*f*2*t)
 e=np.sin(np.pi*np.minimum(t/10,1))**1.5
 add(sig*e,0,.007,0)
# Footsteps derive from the same distance-based gait as the animation.
keys=film['tracks']['x']
def sample_x(time):
 for j in range(1,len(keys)):
  b,v,*et=keys[j];a,u,*_=keys[j-1]
  if time<=b:
   q=np.clip((time-a)/(b-a),0,1)
   if not et or et[0]!='linear':q=q*q*(3-2*q)
   return u+(v-u)*q
 return keys[-1][1]
prev=[None,None]; steps=[]
for tm in np.arange(0,9.4,1/240):
 x=sample_x(tm)
 for leg in range(2):
  phase=(x/(104/.62)+leg*.5)%1
  if prev[leg] is not None and phase<prev[leg]-.5:steps.append((tm,x))
  prev[leg]=phase
for at,x in steps:
 d=.23;tt=np.arange(int(d*SR))/SR
 if x<1300:
  crunch=filt(noise(d),1900)*env(d,.004,25)
  thud=np.sin(2*np.pi*(90*tt-80*tt*tt))*env(d,.003,25)
  add(crunch*.05+thud*.13,at,.8,np.clip((x-960)/1200,-.7,.6))
 else:
  splash=filt(noise(.5),450,'highpass');splash=filt(splash,6800)*env(.5,.005,8)
  add(splash,at,.065,.55)
# Curious sniff, tiny cold gasp, then a resolved breath.
for at,d,v in [(3.35,.19,.021),(3.58,.12,.016),(4.28,.20,.035),(5.40,.45,.018)]:
 sig=filt(noise(d),[600,2600],'bandpass')*np.sin(np.linspace(0,np.pi,int(d*SR)))**1.5
 add(sig,at,v,-.1)
# Drop contact has a soft pitched plip.
d=.24;tt=np.arange(int(d*SR))/SR
add(np.sin(2*np.pi*(1200*tt-1100*tt*tt))*env(d,.001,25),4.29,.047,.05)
# Broad shoulder splash at entry, rolling down into the pool.
for at,v in [(7.65,.065),(8.10,.06),(8.62,.045)]:
 sig=filt(noise(.7),380,'highpass');sig=filt(sig,5500)*env(.7,.016,5)
 add(sig,at,v,.65)
# Tiny distant bird calls at the beginning.
for at in [.38,.61,1.68]:
 d=.12;tt=np.arange(int(d*SR))/SR
 add(np.sin(2*np.pi*(2100*tt+1300*tt*tt))*np.sin(np.linspace(0,np.pi,len(tt)))**2,at,.004,-.8)
fade=np.minimum(t/.06,1)*np.minimum((10-t)/.32,1)
out*=fade[:,None]
# Conservative peak limit retains dynamics, with no clipping.
peak=np.max(np.abs(out));out*=min(3.25,.89/max(peak,1e-9))
outpath=ROOT/'films/bear-waterfall/soundtrack.wav'
with wave.open(str(outpath),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype('<i2').tobytes())
print(outpath, 'peak',round(float(np.max(np.abs(out))),3))
