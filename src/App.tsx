import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, Check,
  ChevronDown, ChevronLeft, ChevronRight, Menu, MoveRight, X,
} from 'lucide-react'
import {
  gallery, kitchenCeilingAdjustmentPerFoot, kitchenFinishes, kitchenLayoutFactors, kitchenRates, packages, projects, services,
  site, testimonials, transformations,
} from './data/site'
import './App.css'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
}
const categories = ['All projects', 'Complete homes', 'Kitchens', 'Living rooms', 'Bedrooms', 'Renovations']
const styles = ['Modern', 'Contemporary', 'Minimalist', 'Scandinavian', 'Industrial', 'Traditional Indian', 'Luxury', 'Not sure']
const servicesList = ['Complete Home Interiors', 'Modular Kitchen', 'Living Room', 'Bedroom and Wardrobe', 'Renovation', 'Commercial Interiors', 'Design Consultation']
const currentYear = new Date().getFullYear()

function ImageWithFallback(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false)
  return <img {...props} src={failed ? '/image-fallback.svg' : props.src} onError={() => setFailed(true)} />
}

const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.'),
  phone: z.string().trim().regex(/^(?:\+?91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  email: z.union([z.literal(''), z.string().email('Enter a valid email address.')]),
  propertyType: z.string().min(1, 'Choose a property type.'),
  location: z.string().trim().min(2, 'Please enter your city or location.'),
  area: z.string().optional(),
  services: z.array(z.string()).min(1, 'Select at least one service.'),
  stage: z.string().optional(),
  startDate: z.string().optional(),
  budget: z.string().optional(),
  style: z.string().optional(),
  kitchenLayout: z.string().optional(),
  package: z.string().optional(),
  requirements: z.string().optional(),
  contactMethod: z.string().optional(),
})
type Inquiry = z.infer<typeof inquirySchema>

function imageUrl(id: string, width = 1200) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('All projects')
  const [activeProject, setActiveProject] = useState<number | null>(null)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [selectedFinish, setSelectedFinish] = useState(kitchenFinishes[0].name)
  const [layout, setLayout] = useState('L-shaped')
  const [finishLevel, setFinishLevel] = useState('Premium')
  const [length, setLength] = useState(10)
  const [width, setWidth] = useState(8)
  const [ceilingHeight, setCeilingHeight] = useState(9)
  const [features, setFeatures] = useState<string[]>(['Base cabinets', 'Wall cabinets', 'Soft-close hardware'])
  const [compare, setCompare] = useState(50)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [formStatus, setFormStatus] = useState('')
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [socialCategory, setSocialCategory] = useState('All')
  const [contactVisible, setContactVisible] = useState(false)

  useEffect(() => {
    if (activeProject === null) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    dialog?.querySelector<HTMLElement>('.modal-close')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveProject(null)
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        setModalImageIndex((current) => (current + (event.key === 'ArrowRight' ? 1 : 2)) % 3)
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = dialog.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [activeProject])

  useEffect(() => {
    const section = document.querySelector('#contact')
    if (!section) return
    const observer = new IntersectionObserver(([entry]) => setContactVisible(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Inquiry>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { services: [], propertyType: '', contactMethod: 'WhatsApp' },
  })
  const visibleProjects = useMemo(() => projects.filter((project) =>
    filter === 'All projects' || project.category === filter), [filter])
  const modalPhotos = activeProject === null ? [] : [
    projects[activeProject].image,
    gallery[(activeProject * 2) % gallery.length].image,
    gallery[(activeProject * 2 + 1) % gallery.length].image,
  ]
  const estimate = useMemo(() => {
    const sizeFactor = Math.max(1, length) * (layout === 'Straight' ? 1 : Math.max(1, width))
    const featureFactor = 1 + features.length * 0.035
    const layoutFactor = kitchenLayoutFactors[layout] ?? 1
    const ceilingFactor = 1 + Math.max(0, ceilingHeight - 9) * kitchenCeilingAdjustmentPerFoot
    const total = Math.round(sizeFactor * kitchenRates[finishLevel] * featureFactor * layoutFactor * ceilingFactor / 10000) * 10000
    return { low: Math.round(total * 0.82 / 10000) * 10000, high: Math.round(total * 1.22 / 10000) * 10000 }
  }, [ceilingHeight, features, finishLevel, layout, length, width])

  const openInquiry = (serviceName?: string, packageName?: string, kitchenLayout?: string, requirements?: string) => {
    if (serviceName) setValue('services', [serviceName], { shouldValidate: true })
    if (packageName) setValue('package', packageName)
    if (kitchenLayout) setValue('kitchenLayout', kitchenLayout)
    if (requirements) setValue('requirements', requirements)
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendInquiry = async (values: Inquiry) => {
    setFormStatus('')
    const text = [
      `Hello ${site.name},`,
      '',
      'I would like to discuss an interior design project.',
      `Name: ${values.name}`,
      `Phone: ${values.phone}`,
      values.email ? `Email: ${values.email}` : '',
      `Property Type: ${values.propertyType}`,
      `Location: ${values.location}`,
      `Area: ${values.area || 'Not specified'}`,
      `Services: ${values.services.join(', ')}`,
      `Project Stage: ${values.stage || 'Not specified'}`,
      `Budget: ${values.budget || 'Need guidance'}`,
      `Preferred Style: ${values.style || 'Not specified'}`,
      `Kitchen Layout: ${values.kitchenLayout || 'Not specified'}`,
      `Selected Package: ${values.package || 'Not selected'}`,
      `Preferred Contact: ${values.contactMethod || 'WhatsApp'}`,
      `Requirements: ${values.requirements || 'Not specified'}`,
      '',
      'Please contact me to discuss the project and arrange a consultation.',
    ].filter(Boolean).join('\n')
    const number = site.whatsappNumber
    const destination = /^91\d{10}$/.test(number) ? `https://wa.me/${number}` : 'https://wa.me/'
    const url = `${destination}?text=${encodeURIComponent(text)}`
    const opened = window.open(url, '_blank')
    if (opened) {
      opened.opener = null
      setFormStatus('Your message is ready in WhatsApp. Please press Send there to transmit your inquiry.')
    } else {
      setFormStatus('Your browser blocked the WhatsApp window. Allow pop-ups and submit again. Your details are still in the form.')
    }
  }

  const faqItems = [
    ['How much do complete home interiors cost?', 'Every home has a different scope. Final pricing depends on area, materials, storage, services, and execution requirements. Share your plans for a project-specific discussion.'],
    ['How is modular kitchen pricing calculated?', 'Kitchen quotations consider layout, running feet, cabinet configuration, finishes, hardware, countertop, appliances, site conditions, and installation—not floor area alone.'],
    ['Do you provide design-only services?', 'Yes. Design consultation and design-only scopes can be discussed separately from execution. The agreed deliverables will be outlined in the project proposal.'],
    ['Do you provide turnkey interior execution?', 'Turnkey coordination can be discussed based on project location and scope. Execution availability and inclusions are confirmed only in a project-specific proposal.'],
    ['Can I customize a package?', 'Packages are a starting point. We can discuss adjusting the scope to suit your home and priorities.'],
    ['How long does a typical project take?', 'Timelines vary with project size, approvals, material lead times, site readiness, and execution scope. A project schedule is discussed after assessment.'],
    ['Can you design a small apartment?', 'Yes. Space planning can make compact homes work harder through thoughtful circulation, storage, and flexible furniture.'],
    ['Do you provide 3D visualizations?', 'Visualization options depend on the selected package and agreed scope. Please mention the spaces you would like visualized.'],
    ['Can I select my own materials?', 'Absolutely. Material choices can be discussed together. Screen swatches are indicative; physical samples and availability should be confirmed before selection.'],
    ['Do you work outside your primary city?', 'Service locations are confirmed case by case. Share your city and project details so the studio can check availability.'],
    ['Are appliances included in the kitchen package?', 'Appliances are not assumed to be included. Any appliance supply or installation must be explicitly listed in the final quotation.'],
    ['How are payments and milestones handled?', 'Payment milestones depend on the agreed scope and are documented in the project proposal before work begins.'],
    ['Do you offer post-installation support?', 'Any post-installation support, duration, and exclusions should be confirmed in the project-specific agreement.'],
  ]

  return (
    <>
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Form and Fable home">
          <span>FORM <i>&</i> FABLE</span><small>INTERIORS</small>
        </Link>
        <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'} aria-label="Main navigation">
          {['About', 'Projects', 'Services', 'Kitchens', 'Packages', 'Process', 'Contact'].map((item) => (
            <a key={item} onClick={() => setMenuOpen(false)} href={`#${item.toLowerCase()}`}>{item}</a>
          ))}
          <a className="nav-mobile-cta" href="#contact" onClick={() => setMenuOpen(false)}>Book a consultation <ArrowRight size={15} /></a>
        </nav>
        <a className="header-cta" href="#contact">Book a consultation <ArrowRight size={15} /></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <ImageWithFallback className="hero-image" src={imageUrl('photo-1600210492486-724fe5c67fb0', 2200)} alt="Warm, contemporary living room with natural wood, a linen sofa and soft architectural light" fetchPriority="high" />
          <div className="hero-scrim" />
          <motion.div className="hero-copy" initial="hidden" animate="visible" variants={fadeUp}>
            <p className="eyebrow light">INTERIOR DESIGN · MODULAR KITCHENS · TURNKEY PROJECTS</p>
            <h1>Spaces that<br /><em>feel like you.</em></h1>
            <p className="hero-subtitle">Beautifully considered interiors, intelligent storage, and thoughtfully designed kitchens — created around the way you live.</p>
            <div className="hero-actions">
              <a className="button button-light" href="#projects">Explore our projects <ArrowRight size={16} /></a>
              <a className="text-link text-link-light" href="#contact">Plan your home <ArrowDownRight size={17} /></a>
            </div>
          </motion.div>
          <div className="hero-caption"><span>01 / THE OAK RESIDENCE</span><span>DESIGNED FOR EVERYDAY LIVING</span></div>
          <a className="scroll-cue" href="#about" aria-label="Scroll to studio introduction"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></a>
          <span className="hero-location">DESIGNING HOMES ACROSS INDIA</span>
        </section>

        <section className="intro section-wrap" id="about">
          <div className="intro-image image-frame">
            <ImageWithFallback src={imageUrl('photo-1600607687939-ce8a6c25118c', 1000)} alt="Sunlit living space featuring natural materials and a quiet neutral palette" loading="lazy" />
            <span className="image-index">A PRACTICE IN THOUGHTFUL LIVING</span>
          </div>
          <motion.div className="intro-copy" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}>
            <p className="eyebrow">A MORE PERSONAL KIND OF DESIGN</p>
            <h2>Good design is more than <em>what you see.</em></h2>
            <p className="body-copy">We believe a home should feel considered, comfortable, and unmistakably yours. From the first plan to the finishing details, we bring together functional layouts, honest materials, and the small rituals that make a space feel like home.</p>
            <div className="principle"><span>OUR DESIGN PRINCIPLE</span><p>Beauty should make everyday life work better.</p></div>
            <a href="#process" className="text-link">Discover our studio <ArrowRight size={16} /></a>
          </motion.div>
        </section>

        <section className="services-section section-pad" id="services">
          <div className="section-heading">
            <div><p className="eyebrow">CONSIDERED FROM THE GROUND UP</p><h2>Spaces for the way<br /><em>you live.</em></h2></div>
            <p className="heading-note">From a thoughtful kitchen refresh to an entire home, every service starts with understanding what matters to you.</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <article className="service-card" key={service.title}>
                <div className="service-photo"><ImageWithFallback src={imageUrl(service.image, 900)} alt={service.alt} loading="lazy" /><span>0{index + 1}</span></div>
                <div className="service-card-copy"><h3>{service.title}</h3><p>{service.description}</p><a href="#contact" onClick={() => openInquiry(service.inquiry)} className="text-link">Explore service <ArrowRight size={15} /></a></div>
              </article>
            ))}
          </div>
          <p className="demo-note">Service scopes and starting costs are discussed and confirmed for each project.</p>
        </section>

        <section className="projects-section section-pad" id="projects">
          <div className="section-heading project-heading">
            <div><p className="eyebrow">A COLLECTION OF DEMO CONCEPTS</p><h2>Homes with a story<br /><em>to tell.</em></h2></div>
            <p className="heading-note">An evolving selection of sample interiors, made to show the possibilities of thoughtful planning.</p>
          </div>
          <div className="filter-row" role="group" aria-label="Filter projects">
            {categories.map((category) => <button key={category} className={filter === category ? 'filter-chip selected' : 'filter-chip'} onClick={() => setFilter(category)}>{category}</button>)}
          </div>
          <motion.div layout className="project-grid">
            <AnimatePresence mode="popLayout">
              {visibleProjects.map((project) => (
                <motion.button layout key={project.title} className={`project-tile ${project.size}`} onClick={() => { setActiveProject(projects.indexOf(project)); setModalImageIndex(0) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35 }}>
                  <div className="project-image"><ImageWithFallback src={imageUrl(project.image, 1050)} alt={`${project.title}, ${project.category.toLowerCase()} concept`} loading="lazy" /><span className="project-open"><ArrowUp size={18} /></span></div>
                  <div className="project-meta"><div><span>{project.category} · {project.city}</span><h3>{project.title}</h3></div><span className="project-area">{project.area}</span></div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
          <p className="demo-note centered">All portfolio projects, locations, areas, and imagery are fictional illustrative demo content.</p>
        </section>

        <section className="kitchen-section" id="kitchens">
          <div className="kitchen-hero">
            <ImageWithFallback src={imageUrl('photo-1600585154340-be6161a56a0c', 2000)} alt="Refined modern kitchen with timber cabinetry and natural stone" loading="lazy" />
            <div className="kitchen-hero-overlay"><p className="eyebrow light">THE HEART OF THE HOME</p><h2>Designed around<br />the way you <em>cook.</em></h2><p>Storage, light, and material choices shaped around your routines and your space.</p><a className="button button-light" href="#planner">Plan your kitchen <ArrowRight size={15} /></a></div>
          </div>
          <div className="kitchen-content section-pad">
            <div className="section-heading"><div><p className="eyebrow">A PLACE FOR EVERY LITTLE THING</p><h2>Find your kitchen<br /><em>shape.</em></h2></div><p className="heading-note">The right layout brings movement, storage, and everyday rituals into a natural rhythm.</p></div>
            <div className="layout-grid">
              {['Straight', 'L-shaped', 'U-shaped', 'Parallel', 'Island', 'Peninsula'].map((item, i) => (
                <button key={item} className={layout === item ? 'layout-card active' : 'layout-card'} onClick={() => { setLayout(item); setValue('kitchenLayout', item) }}>
                  <div className="layout-thumb"><ImageWithFallback src={imageUrl(['photo-1600607687920-4e2a09cf159d', 'photo-1600585154340-be6161a56a0c', 'photo-1600607687920-4e2a09cf159d', 'photo-1600607687939-ce8a6c25118c', 'photo-1600607687644-c7171b42498f', 'photo-1600566753086-00f18fb6b3ea'][i], 500)} alt={`${item} modular kitchen example`} loading="lazy" /><span>0{i + 1}</span></div>
                  <strong>{item}</strong><span className="layout-benefit">{['A streamlined fit for compact spaces', 'A versatile corner that works hard', 'Maximum counters and storage', 'A comfortable two-sided workflow', 'Room to gather and prep together', 'A social, space-conscious solution'][i]}</span>
                </button>
              ))}
            </div>
            <div className="finish-row">
              <div><p className="eyebrow">A PALETTE TO MAKE YOUR OWN</p><h3>Finishes, in focus.</h3><p>Choose a visual reference for your kitchen conversation.</p></div>
              <div className="swatches" role="radiogroup" aria-label="Cabinet finish options">
                {kitchenFinishes.map((finish) => <button key={finish.name} className={selectedFinish === finish.name ? 'swatch selected' : 'swatch'} style={{ '--swatch': finish.color } as React.CSSProperties} onClick={() => setSelectedFinish(finish.name)} role="radio" aria-checked={selectedFinish === finish.name} aria-label={finish.name}><span>{finish.name}</span></button>)}
              </div>
              <div className="finish-selected"><span className="selected-dot" style={{ background: kitchenFinishes.find((f) => f.name === selectedFinish)?.color }} /><b>{selectedFinish}</b><small>selected finish reference</small></div>
            </div>
            <p className="demo-note">Screen colors are indicative only; physical samples, availability, and final specifications must be confirmed before selection.</p>
          </div>
        </section>

        <section className="planner-section section-pad" id="planner">
          <div className="planner-intro"><p className="eyebrow">A FIRST-LOOK PLANNING TOOL</p><h2>Start with a sense<br />of <em>possibility.</em></h2><p>Explore an indicative kitchen budget range based on your early choices. This is not a quotation or a professional measurement.</p><div className="planner-step"><span>01—05</span><p>Choose a layout, share approximate dimensions, and tell us what matters most.</p></div></div>
          <div className="planner-box">
            <div className="planner-topline"><span>KITCHEN PLANNER</span><span>DEMO ESTIMATE</span></div>
            <div className="planner-field"><label>01 &nbsp;Kitchen layout</label><div className="planner-options">{['Straight', 'L-shaped', 'U-shaped', 'Parallel', 'Island'].map((item) => <button key={item} onClick={() => setLayout(item)} className={layout === item ? 'option active' : 'option'}>{item}</button>)}</div></div>
            <div className="dimension-row">
              <label>Length (ft)<input type="number" min="1" max="60" value={length} onChange={(e) => setLength(Math.max(1, Number(e.target.value)))} /></label>
              <label>Width (ft)<input type="number" min="1" max="60" value={width} onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))} /></label>
              <label>Ceiling (ft)<input type="number" min="7" max="20" value={ceilingHeight} onChange={(e) => setCeilingHeight(Math.max(7, Number(e.target.value)))} /></label>
              <div className="area-readout"><span>APPROX. FLOOR AREA</span><b>{layout === 'Straight' ? `${length} linear ft` : `${length * width} sq. ft.`}</b></div>
            </div>
            <div className="planner-field"><label>02 &nbsp;Finish level</label><div className="planner-options">{['Essential', 'Premium', 'Luxury'].map((item) => <button key={item} onClick={() => setFinishLevel(item)} className={finishLevel === item ? 'option active' : 'option'}>{item}</button>)}</div></div>
            <div className="planner-field"><label>03 &nbsp;What would you like to include?</label><div className="feature-grid">{['Base cabinets', 'Wall cabinets', 'Tall units', 'Pantry storage', 'Soft-close hardware', 'Premium countertop', 'Built-in appliances', 'Under-cabinet lighting'].map((item) => <label key={item} className="check-option"><input type="checkbox" checked={features.includes(item)} onChange={() => setFeatures((current) => current.includes(item) ? current.filter((f) => f !== item) : [...current, item])} /><span><Check size={12} /></span>{item}</label>)}</div></div>
            <div className="estimate-result"><div><span>PRELIMINARY INDICATIVE RANGE</span><p>₹{estimate.low.toLocaleString('en-IN')} <i>—</i> ₹{estimate.high.toLocaleString('en-IN')}</p></div><button className="text-link" onClick={() => openInquiry('Modular Kitchen', undefined, layout)}>Discuss your kitchen <ArrowRight size={15} /></button></div>
            <p className="estimate-disclaimer">Illustrative demo estimate only, not a verified market rate or quotation. Actual pricing depends on dimensions, running feet, materials, hardware, appliances, site conditions, and installation. Pricing assumptions are editable in the project configuration.</p>
          </div>
        </section>

        <section className="packages-section section-pad" id="packages">
          <div className="section-heading"><div><p className="eyebrow">A STARTING POINT, NOT A BOX</p><h2>Choose the right<br /><em>kind of help.</em></h2></div><p className="heading-note">Every scope is tailored. These sample packages help frame the conversation, not replace a project-specific proposal.</p></div>
          <div className="package-grid">
            {packages.map((item) => <article className={item.recommended ? 'package-card recommended' : 'package-card'} key={item.name}>
              {item.recommended && <span className="package-tag">A THOUGHTFUL START</span>}
              <p className="eyebrow">{item.type}</p><h3>{item.name}</h3><p className="package-desc">{item.description}</p>
              <div className="package-price">{item.price}<small>{item.note}</small></div>
              <ul>{item.includes.map((include) => <li key={include}><Check size={14} />{include}</li>)}</ul>
              <button className={item.recommended ? 'button button-dark' : 'button button-outline'} onClick={() => openInquiry(undefined, item.name)}>{item.cta}<ArrowRight size={15} /></button>
            </article>)}
          </div>
          <div className="package-compare-wrap">
            <table className="package-compare">
              <thead><tr><th>Typical scope</th>{packages.map((item) => <th key={item.name}>{item.name}</th>)}</tr></thead>
              <tbody>
                <tr><th>Space planning</th><td>Basic</td><td>Detailed</td><td>Detailed</td><td>Kitchen only</td></tr>
                <tr><th>Material guidance</th><td>Suggestions</td><td>Selection support</td><td>Specifications</td><td>Kitchen finishes</td></tr>
                <tr><th>3D visualization</th><td>—</td><td>Agreed spaces</td><td>By scope</td><td>By scope</td></tr>
                <tr><th>Execution coordination</th><td>—</td><td>—</td><td>By proposal</td><td>Installation coordination</td></tr>
                <tr><th>Pricing</th><td>Illustrative start</td><td>Illustrative start</td><td>Custom quote</td><td>Custom quote</td></tr>
              </tbody>
            </table>
          </div>
          <p className="demo-note centered">All prices shown are editable illustrative demo values. Furniture, materials, appliances, taxes, installation, and execution are not included unless explicitly listed in an agreed proposal.</p>
        </section>

        <section className="transformation-section section-pad">
          <div className="section-heading"><div><p className="eyebrow">A DIFFERENT WAY TO SEE THE ROOM</p><h2>Imagine what<br /><em>could be.</em></h2></div><p className="heading-note">A visual comparison to explore how layout, light, and material choices can change the feel of a space.</p></div>
          <div className="comparison" style={{ '--compare': `${compare}%` } as React.CSSProperties}>
            <ImageWithFallback className="comparison-after" src={imageUrl(transformations[0].after, 1800)} alt={`${transformations[0].title}, illustrative after concept`} loading="lazy" />
            <div className="comparison-before"><ImageWithFallback src={imageUrl(transformations[0].before, 1800)} alt={`${transformations[0].title}, illustrative before concept`} loading="lazy" /></div>
            <span className="compare-label before-label">BEFORE · CONCEPT</span><span className="compare-label after-label">AFTER · CONCEPT</span>
            <div className="compare-handle" aria-hidden="true"><span><ChevronLeft size={15} /><ChevronRight size={15} /></span></div>
            <input className="compare-range" type="range" min="0" max="100" value={compare} onChange={(e) => setCompare(Number(e.target.value))} aria-label="Compare before and after images" />
          </div>
          <div className="transformation-caption"><div><span>{transformations[0].room} · ILLUSTRATIVE DEMONSTRATION</span><h3>{transformations[0].title}</h3></div><p>{transformations[0].description}</p></div>
          <p className="demo-note">This is an illustrative sample transformation, not actual client work.</p>
        </section>

        <section className="process-section section-pad" id="process">
          <div className="process-heading"><p className="eyebrow">FROM FIRST HELLO TO FINAL DETAIL</p><h2>A considered<br /><em>process.</em></h2><p>Clarity at every step, with a scope that suits your needs — from a design conversation to a coordinated project.</p></div>
          <div className="process-list">{[
            ['01', 'Discovery', 'We learn how you live, what you need, and what feels right for your home.'],
            ['02', 'Site assessment', 'We collect measurements, understand existing conditions, and listen to your priorities.'],
            ['03', 'Concept & planning', 'We shape the design direction, layout, and material palette around your brief.'],
            ['04', 'Design development', 'We refine drawings, finishes, storage, and agreed design specifications.'],
            ['05', 'Execution & coordination', 'Where included, we coordinate the agreed work, materials, and installation schedule.'],
            ['06', 'Final handover', 'Together, we review the completed scope and any agreed handover items.'],
          ].map(([number, title, copy]) => <motion.article className="process-item" key={number} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div><ArrowDownRight size={18} /></motion.article>)}</div>
          <p className="demo-note process-note">Design consultation, design-only services, and full execution are different scopes; inclusions are confirmed in writing before work begins.</p>
        </section>

        <section className="material-section section-pad">
          <div className="section-heading"><div><p className="eyebrow">TEXTURE, TONE, AND TIME</p><h2>Materials that<br /><em>feel like home.</em></h2></div><p className="heading-note">A few starting points for a tactile, layered material palette. Real samples should always guide the final choice.</p></div>
          <div className="material-grid">
            {['Oak veneer', 'Soft limestone', 'Warm quartz', 'Hand-finished tile'].map((item, index) => <button className="material-card" key={item} onClick={() => openInquiry('Design Consultation', undefined, undefined, `I would like to discuss the ${item} material reference.`)}><ImageWithFallback src={imageUrl(['photo-1616486338812-3dadae4b4ace', 'photo-1600607687920-4e2a09cf159d', 'photo-1600607687939-ce8a6c25118c', 'photo-1600210492486-724fe5c67fb0'][index], 600)} alt={`${item} material mood reference`} loading="lazy" /><span>0{index + 1} · MATERIAL STUDY</span><h3>{item}</h3><small>{['Cabinetry · care: avoid standing moisture', 'Floors · care: seal as specified', 'Countertops · care: confirm manufacturer guidance', 'Backsplash · care: check grout requirements'][index]}</small></button>)}
          </div>
          <p className="demo-note">Images and colors are mood references only and may differ from physical materials.</p>
        </section>

        <section className="why-section">
          <div className="why-image"><ImageWithFallback src={imageUrl('photo-1600566753190-17f0baa2a6c3', 1200)} alt="Thoughtfully designed dining and living space" loading="lazy" /></div>
          <div className="why-content"><p className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</p><h2>Good choices,<br /><em>made together.</em></h2>
            {[['Designed around you', 'Your habits, priorities, and point of view guide the design.'], ['Space that works harder', 'Thoughtful circulation and storage help every square foot feel considered.'], ['Materials with intention', 'We talk through finish, care, and suitability before making a choice.'], ['A clear scope of work', 'Project inclusions and exclusions are discussed before you commit.']].map(([title, copy]) => <div className="benefit" key={title}><span>+</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}
          </div>
        </section>

        <section className="testimonial-section section-pad">
          <p className="eyebrow">WORDS FROM OUR SAMPLE STORYBOOK</p>
          <div className="testimonial-layout"><div className="quote-mark">“</div><div><AnimatePresence mode="wait"><motion.div key={testimonialIndex} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}><blockquote>{testimonials[testimonialIndex].quote}</blockquote><p className="testimonial-person">{testimonials[testimonialIndex].name} <span>· {testimonials[testimonialIndex].project}, {testimonials[testimonialIndex].city}</span></p></motion.div></AnimatePresence><div className="testimonial-controls"><button aria-label="Previous testimonial" onClick={() => setTestimonialIndex((testimonialIndex + testimonials.length - 1) % testimonials.length)}><ArrowLeft size={16} /></button><span>0{testimonialIndex + 1} / 0{testimonials.length}</span><button aria-label="Next testimonial" onClick={() => setTestimonialIndex((testimonialIndex + 1) % testimonials.length)}><ArrowRight size={16} /></button></div></div></div>
          <p className="demo-note">Fictional placeholder testimonial. Replace with approved client feedback before publication.</p>
        </section>

        <section className="faq-section section-pad">
          <div className="faq-intro"><p className="eyebrow">A FEW THINGS YOU MAY BE WONDERING</p><h2>Good questions,<br /><em>honest answers.</em></h2><p>Still curious? Tell us a little about your project and we can take it from there.</p><a href="#contact" className="text-link">Talk to our studio <ArrowRight size={15} /></a></div>
          <div className="faq-list">{faqItems.map(([question, answer], index) => <div className="faq-item" key={question}><button aria-expanded={faqOpen === index} onClick={() => setFaqOpen(faqOpen === index ? null : index)}><span>{question}</span><ChevronDown className={faqOpen === index ? 'rotated' : ''} size={18} /></button><AnimatePresence initial={false}>{faqOpen === index && <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{answer}</p></motion.div>}</AnimatePresence></div>)}</div>
        </section>

        <section className="social-section section-pad">
          <div className="social-heading"><div><p className="eyebrow">A LITTLE MORE INSPIRATION</p><h2>Details worth<br /><em>dwelling on.</em></h2></div><a href={site.social.instagram} target="_blank" rel="noreferrer" className="text-link">Follow the studio <ArrowUp size={14} /></a></div>
          <div className="social-filters">{['All', 'Kitchens', 'Living', 'Bedrooms'].map((item) => <button key={item} className={socialCategory === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setSocialCategory(item)}>{item}</button>)}</div>
          <div className="social-grid">{gallery.filter((item) => socialCategory === 'All' || item.category === socialCategory).slice(0, 6).map((item) => <a href={site.social.instagram} key={item.image} target="_blank" rel="noreferrer"><ImageWithFallback src={imageUrl(item.image, 550)} alt={item.alt} loading="lazy" /><span><ArrowUp size={16} /></span></a>)}</div>
          <p className="demo-note">A curated sample gallery, not a live social media feed.</p>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-intro"><p className="eyebrow light">THE FIRST STEP IS A CONVERSATION</p><h2>Let’s make room<br />for <em>what matters.</em></h2><p>Tell us what you are imagining. We’ll help you find a thoughtful next step.</p>
            <div className="contact-details"><div><span>EMAIL</span><a href={`mailto:${site.email}`}>{site.email}</a></div><div><span>PHONE</span><a href={`tel:${site.phone}`}>{site.phone}</a></div><div><span>STUDIO</span><p>{site.address}</p></div><div><span>SERVICE AREAS</span><p>{site.serviceAreas}</p></div><div><span>HOURS</span><p>{site.hours}</p></div></div>
          </div>
          <form className="inquiry-form" onSubmit={handleSubmit(sendInquiry)} noValidate>
            <div className="form-heading"><span>YOUR PROJECT, IN A FEW WORDS</span><span>* REQUIRED</span></div>
            <div className="form-grid">
              <label>Full name *<input {...register('name')} autoComplete="name" placeholder="Your name" />{errors.name && <small className="field-error">{errors.name.message}</small>}</label>
              <label>Phone number *<input {...register('phone')} autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" />{errors.phone && <small className="field-error">{errors.phone.message}</small>}</label>
              <label>Email address<input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" />{errors.email && <small className="field-error">{errors.email.message}</small>}</label>
              <label>Property type *<select {...register('propertyType')}><option value="">Choose one</option>{['Apartment', 'Independent House', 'Villa', 'Office', 'Retail Space', 'Other'].map((x) => <option key={x}>{x}</option>)}</select>{errors.propertyType && <small className="field-error">{errors.propertyType.message}</small>}</label>
              <label>City / location *<input {...register('location')} placeholder="e.g. Bengaluru" />{errors.location && <small className="field-error">{errors.location.message}</small>}</label>
              <label>Approx. property size<select {...register('area')}><option value="">Choose a range</option>{['Under 500 sq. ft.', '500–800 sq. ft.', '800–1,200 sq. ft.', '1,200–2,000 sq. ft.', 'Above 2,000 sq. ft.'].map((x) => <option key={x}>{x}</option>)}</select></label>
              <fieldset className="form-span"><legend>Services required * <span>Select all that apply</span></legend><div className="service-checks">{servicesList.map((item) => <label key={item}><input type="checkbox" value={item} {...register('services')} /><span>{item}</span></label>)}</div>{errors.services && <small className="field-error">{errors.services.message}</small>}</fieldset>
              <label>Project stage<select {...register('stage')}><option value="">Choose one</option>{['Planning a new home', 'Possession completed', 'Renovation required', 'Construction in progress'].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Expected start date<input {...register('startDate')} type="month" /></label>
              <label>Estimated budget<select {...register('budget')}><option value="">Choose one</option>{['Under ₹1 lakh', '₹1–3 lakh', '₹3–5 lakh', '₹5–10 lakh', '₹10–20 lakh', 'Above ₹20 lakh', 'Need guidance'].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Preferred design style<select {...register('style')}><option value="">Choose one</option>{styles.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Kitchen layout, if applicable<select {...register('kitchenLayout')}><option value="">Not sure yet</option>{['Straight', 'L-shaped', 'U-shaped', 'Parallel', 'Island', 'Peninsula'].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Selected package<select {...register('package')}><option value="">Not selected</option>{packages.map((x) => <option key={x.name}>{x.name}</option>)}</select></label>
              <label className="form-span">A little more about your home<textarea {...register('requirements')} rows={3} placeholder="What would you love this space to do for you?" /></label>
              <fieldset className="form-span"><legend>Preferred way to connect</legend><div className="radio-row">{['WhatsApp', 'Phone', 'Email'].map((x) => <label key={x}><input {...register('contactMethod')} type="radio" value={x} />{x}</label>)}</div></fieldset>
            </div>
            <button className="button button-light form-submit" type="submit" disabled={isSubmitting}>Prepare WhatsApp inquiry <MoveRight size={16} /></button>
            {formStatus && <p className="form-status" role="status">{formStatus}</p>}
            <p className="privacy-note">This demo does not save form data to a database. Submitting opens a prepared message in WhatsApp; you must press Send there to transmit it. Update the studio contact placeholders before launch.</p>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main"><div className="footer-brand"><Link className="wordmark footer-wordmark" to="/"><span>FORM <i>&</i> FABLE</span><small>INTERIORS</small></Link><p>Thoughtfully designed.<br />Beautifully lived.</p></div>
          <div className="footer-column"><span>EXPLORE</span><a href="#about">Our studio</a><a href="#projects">Selected projects</a><a href="#process">Our process</a><a href="#contact">Get in touch</a></div>
          <div className="footer-column"><span>WHAT WE DO</span>{services.slice(0, 4).map((item) => <a href="#services" key={item.title}>{item.title}</a>)}</div>
          <div className="footer-column"><span>FOLLOW ALONG</span><a href={site.social.instagram} target="_blank" rel="noreferrer">Instagram ↗</a><a href={site.social.pinterest} target="_blank" rel="noreferrer">Pinterest ↗</a><a href={site.social.facebook} target="_blank" rel="noreferrer">Facebook ↗</a></div>
        </div>
        <div className="footer-legal">
          <details id="privacy"><summary>Demo privacy note</summary><p>This demonstration does not store inquiry details. Submitting the form opens a WhatsApp message for you to review and send. A production site should publish an accurate privacy notice before collecting or sharing personal information.</p></details>
          <details id="terms"><summary>Demo terms note</summary><p>All services, prices, testimonials, project information, and images on this demonstration site are illustrative and non-contractual. Confirm final scope, pricing, materials, inclusions, and timelines in a signed project proposal.</p></details>
        </div>
        <div className="footer-bottom"><span>© {currentYear} FORM & FABLE INTERIORS · SAMPLE BRAND FOR DEMONSTRATION</span><div><a href="#privacy">Privacy</a><a href="#terms">Terms</a><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>BACK TO TOP <ArrowUp size={13} /></button></div></div>
      </footer>

      <a className={contactVisible || menuOpen ? 'floating-whatsapp hidden' : 'floating-whatsapp'} href={`https://wa.me/?text=${encodeURIComponent(`Hello ${site.name}, I would like to discuss an interior design project.`)}`} target="_blank" rel="noreferrer" aria-label="Start a WhatsApp conversation"><span>Let’s talk</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.79 11.79 0 0 0 12.11 0C5.58 0 .27 5.31.27 11.84c0 2.09.55 4.13 1.59 5.93L.18 24l6.39-1.67a11.8 11.8 0 0 0 5.54 1.41h.01c6.53 0 11.84-5.31 11.84-11.84a11.78 11.78 0 0 0-3.44-8.42ZM12.12 21.7a9.82 9.82 0 0 1-5.01-1.37l-.36-.21-3.79.99 1.01-3.7-.23-.38a9.82 9.82 0 1 1 8.38 4.67Zm5.39-7.36c-.29-.14-1.73-.85-2-.94-.27-.1-.46-.14-.65.14-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.77.36-.27.29-1.01.99-1.01 2.41s1.03 2.79 1.18 2.98c.14.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.55-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.26-.19-.55-.34Z" /></svg></a>

      <AnimatePresence>
        {activeProject !== null && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveProject(null)}>
          <motion.div className="project-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveProject(null)} aria-label="Close project details"><X /></button>
            <div className="modal-image"><ImageWithFallback src={imageUrl(modalPhotos[modalImageIndex], 1600)} alt={`${projects[activeProject].title} sample project view ${modalImageIndex + 1}`} /><span>ILLUSTRATIVE SAMPLE PROJECT · 0{modalImageIndex + 1} / 03</span><div className="modal-gallery-controls"><button aria-label="Previous project image" onClick={() => setModalImageIndex((modalImageIndex + 2) % 3)}><ChevronLeft size={16} /></button>{modalPhotos.map((photo, index) => <button key={`${photo}-${index}`} className={index === modalImageIndex ? 'active' : ''} aria-label={`Show project image ${index + 1}`} aria-pressed={index === modalImageIndex} onClick={() => setModalImageIndex(index)} />)}<button aria-label="Next project image" onClick={() => setModalImageIndex((modalImageIndex + 1) % 3)}><ChevronRight size={16} /></button></div></div>
            <div className="modal-content"><p className="eyebrow">{projects[activeProject].category} · {projects[activeProject].city}</p><h2 id="modal-title">{projects[activeProject].title}</h2><p>{projects[activeProject].description}</p><div className="modal-specs"><span>PROPERTY <b>{projects[activeProject].property}</b></span><span>AREA <b>{projects[activeProject].area}</b></span><span>STYLE <b>{projects[activeProject].style}</b></span></div><div className="modal-details"><div><b>DESIGN OBJECTIVE</b><p>Bring clarity to daily movement with layered lighting, practical storage, and a calm material palette.</p></div><div><b>MATERIAL NOTES</b><p>Warm wood tones, tactile natural finishes, and a grounded combination of soft neutrals.</p></div></div><button className="button button-dark" onClick={() => { setActiveProject(null); openInquiry(projects[activeProject].category === 'Kitchens' ? 'Modular Kitchen' : 'Complete Home Interiors') }}>Design a similar space <ArrowRight size={15} /></button><div className="modal-project-nav"><button onClick={() => { setActiveProject((activeProject + projects.length - 1) % projects.length); setModalImageIndex(0) }} aria-label="Previous project"><ChevronLeft size={18} /> Previous</button><button onClick={() => { setActiveProject((activeProject + 1) % projects.length); setModalImageIndex(0) }} aria-label="Next project">Next <ChevronRight size={18} /></button></div></div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </>
  )
}

export default App
