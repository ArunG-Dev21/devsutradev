import type { MetaFunction } from 'react-router';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export const meta: MetaFunction = () => {
  return [{ title: 'About Us | Devasutra' }];
};

export default function About() {
  return (
    <>
      <section className="bg-white" data-about>
        <div className='w-full h-[50vh] sm:h-[65vh] md:h-[75vh] lg:h-[90vh] col-span-2 overflow-hidden relative'>
          <div className="absolute inset-x-0 top-0 z-20 mix-blend-difference">
            <RouteBreadcrumbBanner variant="overlay" />
          </div>

          <img src='/icons/hindi-logo.png' alt='' width={520} height={130} sizes="(min-width: 1024px) 520px, (min-width: 768px) 320px, (min-width: 640px) 240px, 160px" className='w-40 sm:w-60 md:w-64 lg:w-96 xl:w-130 absolute left-1/2 top-10 sm:top-16 md:top-16 lg:top-20 xl:top-24 -translate-x-1/2' />
          <img
            src='/Albumcover-01.svg'
            alt='About Us'
            width={1920}
            height={1080}
            sizes="100vw"
            className='w-full h-full object-cover object-bottom'
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 mx-auto">
          {/* 1st white card */}
          <div className='aspect-auto md:aspect-square bg-white p-8 sm:p-12 md:p-10 lg:p-16 xl:p-20 text-black space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8 xl:space-y-10 relative border-y border-neutral-100'>
            <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-9xl font-semibold font-heading leading-14 sm:leading-18 md:leading-18 lg:leading-22 xl:leading-28">The<br />Sutra</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>(The Connection)</div>
            <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-montserrat">Devasutra begins where intention <br className="hidden lg:inline" /> becomes devotion.</div>
            <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-montserrat">
              Not in haste.<br />
              Not in abundance.<br />
              But in awareness.
            </div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>It is a thread drawn between <br className="hidden lg:inline" />the seeker and the sacred.</div>
            <div className='absolute left-1/2 bottom-3 sm:bottom-4 md:bottom-5 -translate-x-1/2 bg-red-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full'></div>
            <img src="/icons/icon_1.png" alt="" width={336} height={336} sizes="(min-width: 1024px) 336px, (min-width: 768px) 256px, (min-width: 640px) 192px, 128px" className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-28 right-4 sm:right-8 md:right-12 lg:right-16 w-32 h-32 sm:w-48 sm:h-48 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-84 xl:h-84 pointer-events-none opacity-60 md:opacity-100" />
          </div>

          {/* 2nd black card */}
          <div className='aspect-auto md:aspect-square bg-black p-8 sm:p-12 md:p-10 lg:p-16 xl:p-20 text-white space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8 xl:space-y-10 relative border-y border-neutral-800'>
            <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-9xl font-semibold font-heading leading-14 sm:leading-18 md:leading-18 lg:leading-22 xl:leading-28">On<br />Purity</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>(The Core)</div>
            <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-light font-montserrat">Purity is not appearance <br className="hidden lg:inline" /> Purity is Origin</div>
            <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-light font-montserrat">
              It is what remains<br />
              when excess is removed,<br />
              and truth is allowed to stand.
            </div>
            <div className='text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-light font-montserrat'>Every offer of devasutra<br className="hidden lg:inline" /> is guided by this discipline.</div>
            <div className='absolute left-1/2 bottom-3 sm:bottom-4 md:bottom-5 -translate-x-1/2 bg-red-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full'></div>
            <img src="/icons/icon_2.png" alt="" width={320} height={320} sizes="(min-width: 1024px) 320px, (min-width: 768px) 256px, (min-width: 640px) 192px, 128px" className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-24 right-2 sm:right-4 md:right-6 lg:right-8 w-32 h-32 sm:w-48 sm:h-48 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 pointer-events-none opacity-60 md:opacity-100" />
          </div>

          {/* 3rd card — white on mobile, black on md+ */}
          <div className='aspect-auto md:aspect-square bg-white md:bg-black p-8 sm:p-12 md:p-10 lg:p-16 xl:p-20 text-black md:text-white space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8 xl:space-y-10 relative border-y border-neutral-100 md:border-neutral-800'>
            <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-9xl font-semibold font-heading leading-14 sm:leading-18 md:leading-18 lg:leading-22 xl:leading-28">On<br />Making</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>(The Hand)</div>
            <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-light font-montserrat">Creation here is not<br className="hidden lg:inline" /> manufacture.</div>
            <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-light font-montserrat">
              Hands move with restraint.<br />
              Eyes examine with patience.<br />
              Silence is respected.
            </div>
            <div className='text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-light font-montserrat'>Every bead passes through<br className="hidden lg:inline" /> attention before it reaches you.</div>
            <div className='absolute left-1/2 bottom-3 sm:bottom-4 md:bottom-5 -translate-x-1/2 bg-red-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full'></div>
            <img src="/icons/icon_4.png" alt="" width={288} height={288} sizes="(min-width: 1024px) 288px, (min-width: 768px) 224px, (min-width: 640px) 160px, 112px" className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-28 right-2 sm:right-3 md:right-4 lg:right-5 w-28 h-28 sm:w-40 sm:h-40 md:w-40 md:h-40 lg:w-56 lg:h-56 xl:w-72 xl:h-72 pointer-events-none opacity-60 md:opacity-100" />
          </div>


          {/* 4th card — black on mobile, white on md+ */}
          <div className='aspect-auto md:aspect-square bg-black md:bg-white p-8 sm:p-12 md:p-10 lg:p-16 xl:p-20 text-white md:text-black space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8 xl:space-y-10 relative border-y border-neutral-800 md:border-neutral-100'>
            <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-9xl font-semibold font-heading leading-14 sm:leading-18 md:leading-18 lg:leading-22 xl:leading-28">On<br />Materials</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>(The Earth)</div>
            <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-montserrat">
              Wood that has known time.<br />
              Seeds that carry memory.<br />
              Silver refined to quiet brillance.
            </div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>It is a thread drawn between <br className="hidden lg:inline" />the seeker and the sacred.</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>Nothing is accidential<br />Nothing is hurried.</div>
            <div className='absolute left-1/2 bottom-3 sm:bottom-4 md:bottom-5 -translate-x-1/2 bg-red-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full'></div>
            <img src="/icons/icon_3.png" alt="" width={304} height={304} sizes="(min-width: 1024px) 304px, (min-width: 768px) 240px, (min-width: 640px) 176px, 112px" className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-28 right-8 sm:right-12 md:right-20 lg:right-28 w-28 h-28 sm:w-44 sm:h-44 md:w-44 md:h-44 lg:w-60 lg:h-60 xl:w-76 xl:h-76 pointer-events-none opacity-60 md:opacity-100" />
          </div>


          {/* 5th white card */}
          <div className='aspect-auto md:aspect-square bg-white p-8 sm:p-12 md:p-10 lg:p-16 xl:p-20 text-black space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8 xl:space-y-10 relative border-y border-neutral-100'>
            <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-9xl font-semibold font-heading leading-14 sm:leading-18 md:leading-18 lg:leading-22 xl:leading-28">On<br />Authenticity</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>(The Law)</div>
            <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-montserrat">Authenticity does not declare<br className="hidden lg:inline" /> itself. It endures.</div>
            <div className="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat">
              In a world of limitation,<br />
              Devasutra remains grounded<br />
              in verification, restraint,<br />
              and documented truth.
            </div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>Faith is honoured<br />by responsibility.</div>
            <div className='absolute left-1/2 bottom-3 sm:bottom-4 md:bottom-5 -translate-x-1/2 bg-red-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full'></div>
            <img src="/icons/icon_5.svg" alt="" width={288} height={288} sizes="(min-width: 1024px) 288px, (min-width: 768px) 224px, (min-width: 640px) 160px, 112px" className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-28 right-4 sm:right-8 md:right-12 lg:right-16 w-28 h-28 sm:w-40 sm:h-40 md:w-40 md:h-40 lg:w-56 lg:h-56 xl:w-72 xl:h-72 pointer-events-none opacity-60 md:opacity-100" />
          </div>


          {/* 6th black card */}
          <div className='aspect-auto md:aspect-square bg-black p-8 sm:p-12 md:p-10 lg:p-16 xl:p-20 text-white space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8 xl:space-y-10 relative border-y border-neutral-800'>
            <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-9xl font-semibold font-heading leading-14 sm:leading-18 md:leading-18 lg:leading-22 xl:leading-28">On<br />The Seeker</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>(The Homecoming)</div>
            <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-light font-montserrat">This is not made <br className="hidden lg:inline" />for display or performance</div>
            <div className="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-light font-montserrat">
              It is made for those<br className="hidden lg:inline" />
              who walked inward,who value<br className="hidden lg:inline" />
              steadiness over spectacle.
            </div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-light font-montserrat'>If you have found this,<br className="hidden lg:inline" /> it has found you.<br />it reaches you.</div>
            <div className='absolute left-1/2 bottom-3 sm:bottom-4 md:bottom-5 -translate-x-1/2 bg-red-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full'></div>
            <img src="/icons/icon_6.png" alt="" width={336} height={336} sizes="(min-width: 1024px) 336px, (min-width: 768px) 256px, (min-width: 640px) 192px, 128px" className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-24 right-4 sm:right-8 md:right-12 lg:right-16 w-32 h-32 sm:w-48 sm:h-48 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-84 xl:h-84 pointer-events-none opacity-60 md:opacity-100" />
          </div>

          {/* 7th card — image (pushed to bottom on mobile) */}
          <div className='order-2 md:order-none aspect-square bg-black space-y-10 relative border-y border-neutral-800'>
            <img src='/abt-last-img.jpeg' alt='' width={1000} height={1000} sizes="(min-width: 768px) 50vw, 100vw" className='absolute inset-0 w-full h-full object-cover' />
          </div>

          {/* 8th white card (moved above image on mobile) */}
          <div className='order-1 md:order-none aspect-auto md:aspect-square bg-white p-8 sm:p-12 md:p-10 lg:p-16 xl:p-20 text-black space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8 xl:space-y-10 relative border-y border-neutral-100'>
            <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-9xl font-semibold font-heading leading-14 sm:leading-18 md:leading-18 lg:leading-22 xl:leading-28">On<br />Presence</div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>(The Life)</div>
            <div className="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat">There is no fixed rule<br className="hidden lg:inline" /> No forced ritual. Only constancy</div>
            <div className="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat">
              Wear it.<br />
              Rest it<br />
              Return to it.
            </div>
            <div className='text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-montserrat'>Let it become<br className="hidden lg:inline" /> part of your rhythm</div>
            <div className='absolute left-1/2 bottom-3 sm:bottom-4 md:bottom-5 -translate-x-1/2 bg-red-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full'></div>
            <img src="/icons/icon_7.png" alt="" width={288} height={288} sizes="(min-width: 1024px) 288px, (min-width: 768px) 224px, (min-width: 640px) 160px, 112px" className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-28 right-4 sm:right-8 md:right-12 lg:right-16 w-28 h-28 sm:w-40 sm:h-40 md:w-40 md:h-40 lg:w-56 lg:h-56 xl:w-72 xl:h-72 pointer-events-none opacity-60 md:opacity-100" />
          </div>


        </div>
      </section>
    </>
  );
}
