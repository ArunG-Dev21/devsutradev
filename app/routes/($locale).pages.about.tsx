import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
  return [{ title: 'About Us | Devasutra' }];
};

export default function About() {
  return (
    <>
     <section className="bg-white">
<div className='w-full h-[90vh] col-span-2 overflow-hidden relative'>
  
  <img src='/icons/hindi-logo.png' alt='' className='w-130 absolute left-1/2 top-24 -translate-x-1/2'/>
  <img 
    src='/public/Album cover-01.svg' 
    alt='About Us' 
    className='w-full h-full object-cover object-bottom'
  />
</div>
      <div className="grid grid-cols-2 grid-rows-4 mx-auto">
        {/* 1st white card */}
        <div className='aspect-square bg-white p-20 text-black space-y-10 relative border-y border-neutral-100'>
          <div className="text-9xl font-semibold font-heading leading-28">The<br/>Sutra</div>
          <div className='text-3xl font-subheading'>(The Connection)</div>
          <div className="text-4xl font-body">Devasutra begins where intention <br/> becomes devotion.</div>
          <div className="text-5xl font-body">
            Not int haste.<br/>
            Not in abundance.<br/>
            But in awareness.
          </div>
          <div className='text-3xl font-body'>It is a thread drawn between <br/>the seeker and the sacred.</div>
          <div className='absolute left-1/2 bottom-5 -translate-x-1/2 bg-red-600 w-7 h-7 rounded-full'></div>
          <img src="/icons/icon_1.png" alt="" className="absolute bottom-28 right-16 w-84 h-84 pointer-events-none"/>
        </div>

        {/* 2nd black card */}
        <div className='aspect-square bg-black p-20 text-white space-y-10 relative border-y border-neutral-800'>
          <div className="text-9xl font-semibold font-heading leading-28">On<br/>Purity</div>
          <div className='text-3xl font-subheading'>(The Core)</div>
          <div className="text-4xl font-light font-body">Purity is not appearance <br/> Purity is Origin</div>
          <div className="text-4xl font-light font-body">
            It is what remains<br/>
            when excess is removed,<br/>
            and truth is allowed to stand.
          </div>
          <div className='text-4xl font-light font-body'>Every offer of devasutra<br/>is guided by this discipline.</div>
          <div className='absolute left-1/2 bottom-5 -translate-x-1/2 bg-red-600 w-7 h-7 rounded-full'></div>
          <img src="/icons/icon_2.png" alt="" className="absolute bottom-24 right-8 w-80 h-80 pointer-events-none"/>
        </div>

      {/* 3rd black card */}
        <div className='aspect-square bg-black p-20 text-white space-y-10 relative border-y border-neutral-800'>
          <div className="text-9xl font-semibold font-heading leading-28">On<br/>Making</div>
          <div className='text-3xl font-subheading'>(The Hand)</div>
          <div className="text-5xl font-light font-body">Creation here is not<br/>manufacture.</div>
          <div className="text-4xl font-light font-body">
            Hands move with restraint.<br/>
            Eyes examine with patience.<br/>
            Silence is respected.
          </div>
          <div className='text-4xl font-light font-body'>Every bead passes through<br/>attention before it reaches you.</div>
          <div className='absolute left-1/2 bottom-5 -translate-x-1/2 bg-red-600 w-7 h-7 rounded-full'></div>
          <img src="/icons/icon_4.png" alt="" className="absolute bottom-28 right-5 w-72 h-72 pointer-events-none"/>
        </div>
        

        {/* 4th white card */}
        <div className='aspect-square bg-white p-20 text-black space-y-10 relative border-y border-neutral-100'>
          <div className="text-9xl font-semibold font-heading leading-28">On<br/>Materials</div>
          <div className='text-3xl font-subheading'>(The Earth)</div>
          <div className="text-4xl font-body">
            Wood that has known time.<br/>
            Seeds that carry memory.<br/>
            Silver refined to quiet brillance.
          </div>
          <div className='text-3xl font-body'>It is a thread drawn between <br/>the seeker and the sacred.</div>
          <div className='text-3xl font-body'>Nothing is accidential<br/>Nothing is hurried.</div>
          <div className='absolute left-1/2 bottom-5 -translate-x-1/2 bg-red-600 w-7 h-7 rounded-full'></div>
          <img src="/icons/icon_3.png" alt="" className="absolute bottom-28 right-28 w-76 h-76 pointer-events-none"/>
        </div>


        {/* 5th white card */}
        <div className='aspect-square bg-white p-20 text-black space-y-10 relative border-y border-neutral-100'>
          <div className="text-9xl font-semibold font-heading leading-28">On<br/>Authenticity</div>
          <div className='text-3xl font-subheading'>(The Law)</div>
          <div className="text-5xl font-body">Authenticity does not declare<br/>itself. It endures.</div>
          <div className="text-3xl font-body">
            In a world of limitation,<br/>
            Devasutra remains grounded<br/>
            in verification, restraint,<br/>
            and documented truth.
          </div>
          <div className='text-3xl font-body'>Faith is honoured<br/>by responsibility.</div>
          <div className='absolute left-1/2 bottom-5 -translate-x-1/2 bg-red-600 w-7 h-7 rounded-full'></div>
          <img src="/icons/icon_5.svg" alt="" className="absolute bottom-28 right-16 w-72 h-72 pointer-events-none"/>
        </div>


        {/* 6th black card */}
        <div className='aspect-square bg-black p-20 text-white space-y-10 relative border-y border-neutral-800'>
          <div className="text-9xl font-semibold font-heading leading-28">On<br/>The Seeker</div>
          <div className='text-3xl font-subheading'>(The Homecoming)</div>
          <div className="text-5xl font-light font-body">This is not made <br/>for display or performance</div>
          <div className="text-3xl font-light font-body">
            It is made for those<br/>
            who walked inward,who value<br/>
            steadiness over spectacle.
          </div>
          <div className='text-3xl font-light font-body'>If you have found this,<br/>it haas found.<br/>it reaches you.</div>
          <div className='absolute left-1/2 bottom-5 -translate-x-1/2 bg-red-600 w-7 h-7 rounded-full'></div>
          <img src="/icons/icon_6.png" alt="" className="absolute bottom-24 right-16 w-84 h-84 pointer-events-none"/>
        </div>

        {/* 7th black card */}
        <div className='aspect-square bg-black p-20 space-y-10 relative border-y border-neutral-800'>
          <img src='/abt-last-img.jpeg' alt='' className='absolute inset-0 w-full h-full object-cover'/>
        </div>

        {/* 8th white card */}
        <div className='aspect-square bg-white p-20 text-black space-y-10 relative border-y border-neutral-100'>
          <div className="text-9xl font-semibold font-heading leading-28">On<br/>Presence</div>
          <div className='text-3xl font-subheading'>(The Life)</div>
          <div className="text-3xl font-body">There is no fixed rule<br/>No forced ritual. Only constancy</div>
          <div className="text-3xl font-body">
            Wear it.<br/>
            Rest it<br/>
            Return to it.
          </div>
          <div className='text-3xl font-body'>Let it become<br/>by part of your rhythm</div>
          <div className='absolute left-1/2 bottom-5 -translate-x-1/2 bg-red-600 w-7 h-7 rounded-full'></div>
          <img src="/icons/icon_7.png" alt="" className="absolute bottom-28 right-16 w-72 h-72 pointer-events-none"/>
        </div>
        

      </div>
     </section>
    </>   
  );
}