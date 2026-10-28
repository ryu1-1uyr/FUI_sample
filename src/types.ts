export type Cleanup = () => void;

/**
 * Entry point every sample exports. Render into `el` and return a cleanup
 * that releases everything (rAF, listeners, GPU resources, React roots).
 */
export type Mount = (el: HTMLElement) => Cleanup | void | Promise<Cleanup | void>;

export type SampleModule = { mount: Mount };

export type SampleMeta = {
  title: string;
  description?: string;
  tags?: string[];
};

export type SampleEntry = SampleMeta & {
  id: string;
  load: () => Promise<SampleModule>;
};
