export interface WhitelistedCollege {
  domain: string;
  name: string;
}

export const COLLEGE_WHITELIST: WhitelistedCollege[] = [
  { domain: "iitr.ac.in", name: "IIT Roorkee" },
  { domain: "iitb.ac.in", name: "IIT Bombay" },
  { domain: "iitd.ac.in", name: "IIT Delhi" },
  { domain: "iitm.ac.in", name: "IIT Madras" },
  { domain: "iitk.ac.in", name: "IIT Kanpur" },
  { domain: "iitkgp.ac.in", name: "IIT Kharagpur" },
  { domain: "iitg.ac.in", name: "IIT Guwahati" },
  { domain: "iith.ac.in", name: "IIT Hyderabad" },
  { domain: "bits-pilani.ac.in", name: "BITS Pilani" },
  { domain: "pilani.bits-pilani.ac.in", name: "BITS Pilani (Pilani campus)" },
  { domain: "goa.bits-pilani.ac.in", name: "BITS Pilani (Goa campus)" },
  { domain: "hyderabad.bits-pilani.ac.in", name: "BITS Pilani (Hyderabad campus)" },
  { domain: "nitt.edu", name: "NIT Trichy" },
  { domain: "nitw.ac.in", name: "NIT Warangal" },
  { domain: "mnnit.ac.in", name: "MNNIT Allahabad" },
];

export function getCollegeByEmail(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  const match = COLLEGE_WHITELIST.find((item) => item.domain === domain);
  return match ? match.name : null;
}

export function isEmailWhitelisted(email: string): boolean {
  return getCollegeByEmail(email) !== null;
}
