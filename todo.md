## todo

### generify generation

prior, we were handling all the generation internally; i'd like to keep the implementation, but I'd also like to generify generation - I like the idea that segment generation is one part of the work, and then we pass in all of these "generator implementations" to build geometry around them

- we can generate internal segments the same way
- generators receive internal segments
- possibly: generate external segments as well - we can transform them! -- actually: create internal/external segments in one place - we'll hard code normal info, so that we can get extruded segments from internal data (2d normal, non-normalized)
- generators should naturally take responsibility for their creating data - if we need to, we should extract from the generator
- alt: handle generation flow ourselves, compile separately (probably best)