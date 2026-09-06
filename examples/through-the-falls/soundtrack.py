"""Original score and designed Foley. No downloaded recordings or model audio."""
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io.wavfile import write
from pathlib import Path
SR=48000; DUR=10;N=SR*DUR
rng=np.random.default_rng(882)
out=Path(__file__).parent/'audio';out.mkdir(exist_ok=True)
t=np.arange(N)/SR

def filt(x,f,kind='lowpass',order=2):return sosfilt(butter(order,f,btype=kind,fs=SR,output='sos'),x)
def noise(n):return rng.normal(0,1,n)
def pan(x,p=0):return x[:,None]*np.array([np.sqrt((1-p)/2),np.sqrt((1+p)/2)])
def add(dst,x,start,p=0,gain=1):
 pos=int(start*SR);length=min(len(x),len(dst)-pos)
 if length>0:dst[pos:pos+length]+=pan(x[:length]*gain,p)
def save(name,x):
 peak=np.max(np.abs(x));x=x/max(1,peak/0.9);write(out/name,SR,(np.clip(x,-1,1)*32767).astype(np.int16))
def env(n,attack=.04,release=.15):
 tt=np.arange(n)/SR;return np.minimum(tt/attack,1)*np.minimum((n/SR-tt)/release,1)
# Layered broadband white water; slowly approaches and opens in stereo.
amb=np.zeros((N,2));rise=.55+.45/(1+np.exp(-(t-6.4)*1.5))
for k in range(2):
 n=noise(N);rumble=filt(n,230);hiss=filt(filt(n,6500),900,'highpass');body=filt(n,1300)
 amb[:,k]=(rumble*.26+body*.15+hiss*.042)*rise*(.95+.05*np.sin(t*(.7+k*.13)))
# Distant tiny forest bird calls, kept unobtrusive beneath the waterfall.
for start,f,p in[(.7,1800,-.65),(1.05,2300,-.5),(2.2,1650,.35)]:
 n=int(.15*SR);tt=np.arange(n)/SR;call=np.sin(2*np.pi*(f*tt+380*tt*tt))*np.sin(np.pi*tt/.15)**2;add(amb,call,start,p,.006)
amb*=env(N,.45,.5)[:,None];save('river.wav',amb)
# Soft original D pentatonic phrase: bowed low strings, felted plucks and breathy flute.
score=np.zeros((N,2))
def note(freq,duration,voice):
 n=int(duration*SR);tt=np.arange(n)/SR
 if voice=='plucked':
  x=sum(np.sin(2*np.pi*freq*h*tt)*np.exp(-tt*(1.5+h*.65))/(h*h*.8) for h in range(1,7));x*=env(n,.008,.3)
 elif voice=='flute':
  phase=2*np.pi*freq*tt+0.012*np.sin(2*np.pi*4.9*tt);x=(np.sin(phase)+.15*np.sin(phase*2)+.025*np.sin(phase*3));x*=env(n,.16,.25);x+=filt(noise(n),2400)*.025*env(n,.2,.2)
 else:
  x=np.zeros(n)
  for detune in[-.002,.0015]:
   x+=sum(np.sin(2*np.pi*freq*(1+detune)*h*tt+.012*np.sin(tt*28))/(h**1.7) for h in range(1,6))*.5
  x*=env(n,.65,.9)
 return x
for freq,gain,p in[(146.83,.038,-.35),(220,.024,.2),(293.66,.017,.45)]:add(score,note(freq,9.8,'bowed'),.1,p,gain)
for start,f,d,g in[(.2,293.66,2.2,.095),(1.15,440,1.9,.058),(2.25,587.33,2,.06),(4.42,493.88,1.5,.047),(5.25,440,1.7,.05),(6.08,587.33,2,.065),(7.05,659.25,1.8,.054),(8.12,880,1.8,.04),(8.8,587.33,1.2,.045)]:add(score,note(f,d,'plucked'),start,-.15,g)
for start,f,d in[(1.45,440,1.0),(2.42,587.33,.9),(4.65,493.88,.63),(5.25,440,.68),(6.05,587.33,1.12),(7.15,659.25,.65),(7.78,587.33,1.75)]:add(score,note(f,d,'flute'),start,.18,.032)
# Stereo early reflections and a quiet diffuse tail.
dry=score.copy()
for delay,g in[(.073,.18),(.149,.13),(.227,.12),(.389,.09),(.577,.06),(.811,.035)]:
 off=int(delay*SR);score[off:]+=dry[:-off,::-1]*g
score*=env(N,.25,.65)[:,None];save('score.wav',score)
# Heavy padded footsteps: low weight, gravel brush and occasional claw ticks.
foley=np.zeros((N,2))
for i,start in enumerate([.18,.69,1.23,1.76,2.29,2.83,5.77,6.32,6.86,7.40,7.95,8.49,9.03]):
 n=int(.25*SR);tt=np.arange(n)/SR;thud=np.sin(2*np.pi*(76*tt-75*tt*tt))*np.exp(-tt*31);grit=filt(noise(n),1600)*np.exp(-tt*27);x=(.19*thud+.07*grit)*env(n,.005,.05);add(foley,x,start,-.35+min(start/10,.8),.55)
 if start>6:
  splash=filt(noise(int(.4*SR)),3600);sT=np.arange(len(splash))/SR;splash*=np.exp(-sT*12)*np.minimum(sT/.018,1);add(foley,splash,start+.01,.25,.055+(start-6)*.012)
# Curious inhale, cold spray, surprised huff and calm exhale.
for start,duration,gain in[(3.42,.3,.075),(3.88,.23,.10),(4.35,.43,.055)]:
 n=int(duration*SR);tt=np.arange(n)/SR;x=filt(filt(noise(n),2000),260,'highpass')*np.sin(np.pi*tt/duration)**1.5;add(foley,x,start,.06,gain)
for start,duration,gain in[(3.78,.35,.05),(7.9,.55,.07),(8.4,.9,.08)]:
 n=int(duration*SR);tt=np.arange(n)/SR;x=filt(noise(n),5400)*np.sin(np.pi*tt/duration)**1.6;add(foley,x,start,.28,gain)
foley*=env(N,.05,.4)[:,None];save('foley.wav',foley)
print('Wrote three original stereo 48 kHz soundtrack stems.')
